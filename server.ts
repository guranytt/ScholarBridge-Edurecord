import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';

let prismaClient: PrismaClient | null = null;
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!prismaClient) {
      try {
        prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: "file:/app/applet/prisma/dev.db"
            }
          }
        });
      } catch (err) {
        console.error("PrismaClient initialization failed", err);
      }
    }
    const val = (prismaClient as any)?.[prop];
    return typeof val === 'function' ? val.bind(prismaClient) : val;
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'prisma', 'academic_settings.json');

function getAcademicSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error("Failed to read settings file", err);
  }
  return {
    currentTerm: "Term 1",
    currentSession: "2025/2026",
    allow_teachers_edit: true,
    allow_students_view: true,
    strict_proctoring: true,
    allowed_roles: ["admin", "teacher", "student"]
  };
}

function saveAcademicSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Failed to write settings file", err);
    return false;
  }
}

async function createAuditLog(userId: string, action: string, entity: string) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        entity
      }
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth APIs ---
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      
      const pwdMatch = await bcrypt.compare(password, user.password_hash);
      if (!pwdMatch) return res.status(401).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ userId: user.id, role: user.role, institutionId: user.institution_id }, JWT_SECRET, { expiresIn: '1d' });
      await createAuditLog(user.id, "User authenticated and logged in", `User: ${user.name} (${user.role})`);
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/auth/register-institution - Sign up a new school/institution and assign a super-admin
  app.post('/api/auth/register-institution', async (req, res) => {
    const { name, adminName, adminEmail, adminPassword } = req.body;
    try {
      if (!name || !adminName || !adminEmail || !adminPassword) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (existingUser) {
        return res.status(400).json({ error: 'Admin email already exists. Please choose another.' });
      }

      // Create Institution first
      const institution = await prisma.institution.create({
        data: {
          name,
          subscription_plan: 'pro',
          status: 'active'
        }
      });

      // Create Admin User
      const password_hash = await bcrypt.hash(adminPassword, 10);
      const user = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password_hash,
          role: 'admin',
          institution_id: institution.id
        }
      });

      // Automatically seed standard classes and subjects for immediate usability
      const g9 = await prisma.class.create({ data: { name: 'Grade 9 General', level: '9', institution_id: institution.id } });
      const g10 = await prisma.class.create({ data: { name: 'Grade 10 General', level: '10', institution_id: institution.id } });
      
      await prisma.subject.create({ data: { name: 'Mathematics', code: 'MTH101', institution_id: institution.id } });
      await prisma.subject.create({ data: { name: 'English Language', code: 'ENG101', institution_id: institution.id } });
      await prisma.subject.create({ data: { name: 'General Science', code: 'SCI101', institution_id: institution.id } });

      await createAuditLog(user.id, "Registered institution and Super-Admin configured", `Institution: ${name}`);

      const token = jwt.sign({ userId: user.id, role: user.role, institutionId: user.institution_id }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error setting up institution' });
    }
  });

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch(e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Teacher Administration APIs ---
  app.get('/api/teachers', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const teachers = await prisma.user.findMany({
        where: { institution_id: institutionId, role: 'teacher' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      res.json(teachers);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error loading teachers' });
    }
  });

  app.post('/api/teachers', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { name, email, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if email already exists
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(400).json({ error: 'A user with this email address already exists.' });
      }

      const hash = await bcrypt.hash(password || 'password123', 10);
      const teacher = await prisma.user.create({
        data: {
          name,
          email,
          password_hash: hash,
          role: 'teacher',
          institution_id: institutionId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      await createAuditLog(req.user.userId, `CREATED_TEACHER: Configured access for ${name} (${email})`, 'User');
      res.json(teacher);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error creating teacher' });
    }
  });

  app.delete('/api/teachers/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;

      const deletedUser = await prisma.user.findFirst({
        where: { id, institution_id: institutionId, role: 'teacher' }
      });

      // Unassign teacher assignments first
      await prisma.teacherAssignment.deleteMany({
        where: { teacher_id: id, institution_id: institutionId }
      });

      // Delete the teacher user
      await prisma.user.delete({
        where: { id, institution_id: institutionId, role: 'teacher' }
      });

      await createAuditLog(req.user.userId, `TERMINATED_TEACHER: Removed staff profile for ${deletedUser?.name || id}`, 'User');

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error deleting teacher role' });
    }
  });

  // --- Classes Administration ---
  app.post('/api/classes', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { name, level } = req.body;

      if (!name || !level) {
        return res.status(400).json({ error: 'Name and level are required' });
      }

      const newCls = await prisma.class.create({
        data: {
          name,
          level: String(level),
          institution_id: institutionId
        }
      });
      await createAuditLog(req.user.userId, `CREATED_CLASSROOM: Established class "${name}" (Level ${level})`, 'Class');
      res.json(newCls);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/classes/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;

      const targetClass = await prisma.class.findFirst({
        where: { id, institution_id: institutionId }
      });

      // Delete assignments or handle cascades
      await prisma.teacherAssignment.deleteMany({ where: { class_id: id, institution_id: institutionId } });
      await prisma.class.delete({ where: { id, institution_id: institutionId } });
      
      await createAuditLog(req.user.userId, `DELETED_CLASSROOM: Disbanded class "${targetClass?.name || id}"`, 'Class');

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error deleting class' });
    }
  });

  // --- Subjects Administration ---
  app.post('/api/subjects', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
      }

      const newSub = await prisma.subject.create({
        data: {
          name,
          code,
          institution_id: institutionId
        }
      });
      res.json(newSub);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error creating subject' });
    }
  });

  // --- Teacher Assignments APIs ---
  app.get('/api/assignments', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      const assignments = await prisma.teacherAssignment.findMany({
        where: { institution_id: institutionId },
        include: {
          class: true,
          subject: true
        }
      });

      // We need to resolve teacher names manually since teacher_id doesn't have a direct back-relation in schema
      const teacherIds = assignments.map(a => a.teacher_id);
      const teachers = await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, email: true }
      });

      const enriched = assignments.map(a => {
        const t = teachers.find(t => t.id === a.teacher_id);
        return {
          ...a,
          teacher: t || { id: a.teacher_id, name: 'Unknown Teacher', email: '' }
        };
      });

      res.json(enriched);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/assignments', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { teacher_id, class_id, subject_id } = req.body;

      if (!teacher_id || !class_id || !subject_id) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const assignment = await prisma.teacherAssignment.create({
        data: {
          teacher_id,
          class_id,
          subject_id,
          institution_id: institutionId
        }
      });
      res.json(assignment);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error creating assignment' });
    }
  });

  app.delete('/api/assignments/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;

      await prisma.teacherAssignment.delete({
        where: { id, institution_id: institutionId }
      });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Student APIs ---
  app.get('/api/students', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      const students = await prisma.student.findMany({
        where: { institution_id: institutionId },
        include: { class: true, results: true }
      });
      res.json(students);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/students', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      const { full_name, admission_number, class_id } = req.body;
      
      const email = `${admission_number.toLowerCase()}@student.com`;
      const password_hash = await bcrypt.hash('password123', 10);

      const user = await prisma.user.create({
        data: {
          name: full_name,
          email,
          password_hash,
          role: 'student',
          institution_id: institutionId
        }
      });

      const newStudent = await prisma.student.create({
        data: {
          full_name,
          admission_number,
          class_id,
          user_id: user.id,
          institution_id: institutionId
        }
      });
      res.json(newStudent);
    } catch(e: any) {
      console.error(e);
      if (e.code === 'P2002') return res.status(400).json({ error: 'Admission number already exists.' });
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/students/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      const { id } = req.params;
      
      const stu = await prisma.student.findUnique({ where: { id } });
      if (stu) {
        await prisma.result.deleteMany({ where: { student_id: id } });
        await prisma.reportCard.deleteMany({ where: { student_id: id } });
        await prisma.student.delete({
          where: { id, institution_id: institutionId }
        });
        if (stu.user_id) {
          await prisma.user.delete({ where: { id: stu.user_id } });
        }
      }
      res.json({ success: true });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // --- Classes and Subjects APIs ---
  app.get('/api/classes', requireAuth, async (req: any, res: any) => {
    try {
      const classes = await prisma.class.findMany({ where: { institution_id: req.user.institutionId } });
      res.json(classes);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/subjects', requireAuth, async (req: any, res: any) => {
    try {
      const subjects = await prisma.subject.findMany({ where: { institution_id: req.user.institutionId } });
      res.json(subjects);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Results APIs ---
  app.post('/api/results', requireAuth, async (req: any, res: any) => {
    try {
      const { results, term, session } = req.body;
      let createdCount = 0;
      for (const result of results) {
         let testStore = Number(result.test_score) || 0;
         let examScore = Number(result.exam_score) || 0;
         let total = testStore + examScore;
         let grade = 'F';
         if(total >= 70) grade = 'A';
         else if(total >= 60) grade = 'B';
         else if(total >= 50) grade = 'C';
         else if(total >= 45) grade = 'D';
         else if(total >= 40) grade = 'E';

         const record = await prisma.result.upsert({
           where: {
             student_id_subject_id_term_session: {
               student_id: result.student_id,
               subject_id: result.subject_id,
               term,
               session
             }
           },
           update: {
             test_score: testStore,
             exam_score: examScore,
             total_score: total,
             grade
           },
           create: {
             student_id: result.student_id,
             subject_id: result.subject_id,
             test_score: testStore,
             exam_score: examScore,
             total_score: total,
             grade,
             term,
             session
           }
         });
         createdCount++;
      }
      res.json({ message: 'Success', count: createdCount });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/dashboard', requireAuth, async (req: any, res: any) => {
    try {
      const { institutionId } = req.user;
      const counts = await prisma.$transaction([
        prisma.student.count({ where: { institution_id: institutionId } }),
        prisma.user.count({ where: { role: 'teacher', institution_id: institutionId } }),
        prisma.class.count({ where: { institution_id: institutionId } })
      ]);
      res.json({ students: counts[0], teachers: counts[1], classes: counts[2] });
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Student Portal APIs ---
  app.get('/api/student/me', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const student = await prisma.student.findUnique({
        where: { user_id: req.user.userId },
        include: { class: true, results: true }
      });
      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      // Compute Average Score across all results for current term. Wait, let's just send the student.
      res.json(student);
    } catch(e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/student/results', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const { term, session } = req.query;
      const student = await prisma.student.findUnique({ where: { user_id: req.user.userId } });
      if (!student) return res.status(404).json({ error: 'Not found' });

      const filter: any = { student_id: student.id };
      if (term) filter.term = term;
      if (session) filter.session = session;

      const results = await prisma.result.findMany({
        where: filter,
        include: { subject: true },
        orderBy: { subject: { name: 'asc' } }
      });
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/student/report-cards', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const { term, session } = req.query;
      const student = await prisma.student.findUnique({ where: { user_id: req.user.userId } });
      if (!student) return res.status(404).json({ error: 'Not found' });

      const filter: any = { student_id: student.id };
      if (term) filter.term = term;
      if (session) filter.session = session;

      const reportCards = await prisma.reportCard.findMany({
        where: filter,
        orderBy: [{ session: 'desc' }, { term: 'desc' }]
      });
      res.json(reportCards);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- TIMED TEST & PROCTORING APIS ---

  // -- Teacher endpoints --
  // GET /api/tests - Fetch all tests
  app.get('/api/tests', requireAuth, async (req: any, res: any) => {
    try {
      const tests = await prisma.test.findMany({
        include: {
          class: true,
          subject: true,
          attempts: true
        },
        orderBy: { created_at: 'desc' }
      });
      res.json(tests);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/tests - Create a test
  app.post('/api/tests', requireAuth, async (req: any, res: any) => {
    try {
      const { title, description, duration_minutes, class_id, subject_id, is_published, questions } = req.body;
      const test = await prisma.test.create({
        data: {
          title,
          description,
          duration_minutes: Number(duration_minutes) || 30,
          class_id,
          subject_id,
          is_published: !!is_published,
          questions_json: JSON.stringify(questions)
        },
        include: {
          class: true,
          subject: true,
          attempts: true
        }
      });
      res.json(test);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // PUT /api/tests/:id - Update a test
  app.put('/api/tests/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { title, description, duration_minutes, class_id, subject_id, is_published, questions } = req.body;
      const test = await prisma.test.update({
        where: { id },
        data: {
          title,
          description,
          duration_minutes: Number(duration_minutes) || 30,
          class_id,
          subject_id,
          is_published: !!is_published,
          questions_json: JSON.stringify(questions)
        },
        include: {
          class: true,
          subject: true,
          attempts: true
        }
      });
      res.json(test);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // DELETE /api/tests/:id - Delete a test
  app.delete('/api/tests/:id', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      // Delete attempts first to avoid foreign key violations
      await prisma.attempt.deleteMany({ where: { test_id: id } });
      await prisma.test.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/tests/:id/attempts - Fetch attempts for a specific test
  app.get('/api/tests/:id/attempts', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const attempts = await prisma.attempt.findMany({
        where: { test_id: id },
        include: {
          student: true
        },
        orderBy: { started_at: 'desc' }
      });
      res.json(attempts);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });


  // -- Student endpoints --
  // GET /api/student/tests - Fetch published tests for student class
  app.get('/api/student/tests', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      
      const student = await prisma.student.findUnique({
        where: { user_id: req.user.userId }
      });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      // Find published tests for this student's class
      const tests = await prisma.test.findMany({
        where: {
          class_id: student.class_id,
          is_published: true
        },
        include: {
          subject: true,
          attempts: {
            where: { student_id: student.id },
            orderBy: { started_at: 'desc' }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Secure questions: remove the answer key from the questions dictionary
      const secureTests = tests.map((t: any) => {
        let qArray = [];
        try {
          qArray = JSON.parse(t.questions_json);
        } catch (e) {
          qArray = [];
        }
        // Strip correct option
        const safeQuestions = qArray.map((q: any) => ({
          text: q.text,
          options: q.options
        }));

        return {
          ...t,
          questions: safeQuestions
        };
      });

      res.json(secureTests);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/student/tests/:testId/start - Start or resume a test attempt
  app.post('/api/student/tests/:testId/start', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const { testId } = req.params;

      const student = await prisma.student.findUnique({
        where: { user_id: req.user.userId }
      });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: { subject: true }
      });
      if (!test) return res.status(404).json({ error: 'Test not found' });

      // Check if there is already an ongoing attempt
      let attempt = await prisma.attempt.findFirst({
        where: {
          test_id: testId,
          student_id: student.id,
          status: 'ongoing'
        }
      });

      if (!attempt) {
        // Create brand new attempt
        attempt = await prisma.attempt.create({
          data: {
            test_id: testId,
            student_id: student.id,
            status: 'ongoing',
            tab_focus_violations: 0
          }
        });
      }

      // Secure questions - strip answers
      let qArray = [];
      try {
        qArray = JSON.parse(test.questions_json);
      } catch (e) {
        qArray = [];
      }
      const safeQuestions = qArray.map((q: any) => ({
        text: q.text,
        options: q.options
      }));

      res.json({
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          duration_minutes: test.duration_minutes,
          subject: test.subject,
          questions: safeQuestions
        },
        attempt
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/student/tests/attempts/:attemptId/violate - Log visual unfocus violation immediately
  app.post('/api/student/tests/attempts/:attemptId/violate', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const { attemptId } = req.params;

      const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId }
      });
      if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
      if (attempt.status !== 'ongoing') {
        return res.json({ violations: attempt.tab_focus_violations, status: attempt.status });
      }

      const nextViolations = attempt.tab_focus_violations + 1;
      const nextStatus = nextViolations >= 3 ? 'flagged_cheating' : 'ongoing';

      const updated = await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          tab_focus_violations: nextViolations,
          status: nextStatus
        }
      });

      res.json({ violations: updated.tab_focus_violations, status: updated.status });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/student/tests/attempts/:attemptId/submit - Complete & submit answers
  app.post('/api/student/tests/attempts/:attemptId/submit', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
      const { attemptId } = req.params;
      const { answers } = req.body; // e.g. { "0": 1, "1": 0 }

      const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: { test: true }
      });
      if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
      if (attempt.status !== 'ongoing' && attempt.status !== 'flagged_cheating') {
        return res.status(400).json({ error: 'Attempt is already submitted or locked.' });
      }

      // Grade the attempt!
      let questions = [];
      try {
        questions = JSON.parse(attempt.test.questions_json);
      } catch (e) {
        questions = [];
      }

      let correctCount = 0;
      questions.forEach((q: any, idx: number) => {
        const studentSelect = answers?.[idx];
        if (studentSelect !== undefined && Number(studentSelect) === q.correctOption) {
          correctCount++;
        }
      });

      const totalQuestions = questions.length || 1;
      const rawScore = (correctCount / totalQuestions) * 100;
      const finalScore = Math.round(rawScore * 100) / 100; // 2 decimal places

      // Maintain 'flagged_cheating' status if violations >= 3, else 'submitted'
      const finalStatus = attempt.tab_focus_violations >= 3 ? 'flagged_cheating' : 'submitted';

      const updated = await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          score: finalScore,
          status: finalStatus,
          answers_json: JSON.stringify(answers),
          submitted_at: new Date()
        }
      });

      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Academic Settings Router ---
  app.get('/api/academic/settings', requireAuth, async (req: any, res: any) => {
    try {
      const settings = getAcademicSettings();
      res.json(settings);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch academic settings.' });
    }
  });

  app.post('/api/academic/settings', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can configure system settings.' });
      }
      
      const payload = req.body;
      const success = saveAcademicSettings(payload);
      if (success) {
        await createAuditLog(req.user.userId, `Configured term active state to ${payload.currentTerm} (${payload.currentSession}) & updated roles/permissions`, 'System Settings');
        res.json(payload);
      } else {
        res.status(500).json({ error: 'Failed to write settings to database payload.' });
      }
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Audit Logs Retrieval ---
  app.get('/api/audit-logs', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins have access to security audit trails.' });
      }

      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100 // Safe limit
      });

      // Enrich with userName
      const userIds = Array.from(new Set(logs.map(l => l.user_id)));
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true }
      });

      const enrichedLogs = logs.map(log => {
        const u = users.find(u => u.id === log.user_id);
        return {
          ...log,
          userName: u ? `${u.name} (${u.role})` : 'System Core/Anonymous'
        };
      });

      res.json(enrichedLogs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to query student logs db' });
    }
  });

  // --- Study Notes / Study Material Files Router ---
  app.get('/api/notes', requireAuth, async (req: any, res: any) => {
    try {
      const notes = await prisma.studyNote.findMany({
        orderBy: { created_at: 'desc' }
      });

      // Enrich notes with Class & Subject info
      const classes = await prisma.class.findMany({ where: { institution_id: req.user.institutionId } });
      const subjects = await prisma.subject.findMany({ where: { institution_id: req.user.institutionId } });

      const enriched = notes.map(n => {
        const cls = classes.find(c => c.id === n.class_id);
        const sub = subjects.find(s => s.id === n.subject_id);
        return {
          ...n,
          className: cls ? cls.name : 'All Classes',
          subjectName: sub ? sub.name : 'General Resources'
        };
      });

      res.json(enriched);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  app.post('/api/notes', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Action restricted to teachers and administrators.' });
      }

      const { title, class_id, subject_id, file_name, file_content } = req.body;
      if (!title || !class_id || !subject_id) {
        return res.status(400).json({ error: 'Title, Class and Subject references are required to bind notes.' });
      }

      const note = await prisma.studyNote.create({
        data: {
          title,
          class_id,
          subject_id,
          file_name: file_name || 'Note.txt',
          file_content: file_content || ''
        }
      });

      await createAuditLog(req.user.userId, `Published study notes/files on subject: "${title}"`, 'Study Material Resources');
      res.json(note);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error uploading materials' });
    }
  });

  app.delete('/api/notes/:id', requireAuth, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Action restricted to teachers and administrators.' });
      }

      const { id } = req.params;
      const note = await prisma.studyNote.findUnique({ where: { id } });
      
      if (!note) return res.status(404).json({ error: 'Study note details missing' });

      await prisma.studyNote.delete({ where: { id } });
      await createAuditLog(req.user.userId, `Deleted file content: "${note.title}"`, 'Study Material Resources');
      
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Setup Vite Middleware for frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa', // Fallback to index.html for React Router
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Provide a wildcard fallback for React Router in production
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
