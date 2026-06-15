import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { 
  UserSquare2, Plus, Trash2, Loader2, BookOpen, 
  GraduationCap, Calendar, Settings, ShieldCheck, Search 
} from 'lucide-react';

export default function AdminTeachers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'teachers' | 'assignments' | 'classes_subjects'>('teachers');
  const [search, setSearch] = useState('');

  // Form States
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('password123');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  const [className, setClassName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  // Queries
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiCall('/teachers') as Promise<any[]>
  });

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes') as Promise<any[]>
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiCall('/subjects') as Promise<any[]>
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => apiCall('/assignments') as Promise<any[]>
  });

  // Mutations
  const addTeacherMutation = useMutation({
    mutationFn: (data: any) => apiCall('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setTeacherName('');
      setTeacherEmail('');
      setTeacherPassword('password123');
      setIsAddingTeacher(false);
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/teachers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    }
  });

  const addClassMutation = useMutation({
    mutationFn: (data: any) => apiCall('/classes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setClassName('');
      setClassLevel('');
      setIsAddingClass(false);
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    }
  });

  const addSubjectMutation = useMutation({
    mutationFn: (data: any) => apiCall('/subjects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setSubjectName('');
      setSubjectCode('');
      setIsAddingSubject(false);
    }
  });

  const addAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiCall('/assignments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setAssignTeacherId('');
      setAssignClassId('');
      setAssignSubjectId('');
      setIsAddingAssignment(false);
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/assignments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    }
  });

  // Filtered Teacher List
  const filteredTeachers = teachers?.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Navigation Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Staff Management</h1>
        <p className="mt-1 text-sm text-slate-500">Configure your educators, physical classroom listings, and general course structures.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { setActiveTab('teachers'); setSearch(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
            activeTab === 'teachers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Faculty ({teachers?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('assignments'); setSearch(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
            activeTab === 'assignments' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Course Assignments ({assignments?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('classes_subjects'); setSearch(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all ${
            activeTab === 'classes_subjects' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Classrooms & Subject Directory
        </button>
      </div>

      {/* --- TAB 1: TEACHER ENROLLMENT --- */}
      {activeTab === 'teachers' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm/50">
            <div className="relative rounded-xl max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="focus:ring-indigo-500/20 focus:border-indigo-600 block w-full pl-10 text-sm border-slate-200 rounded-xl py-2 px-3 border bg-slate-50 focus:bg-white transition-all focus:outline-none"
                placeholder="Search teachers..."
              />
            </div>
            
            <button
              onClick={() => setIsAddingTeacher(!isAddingTeacher)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow shadow-indigo-100 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              <Plus className="-ml-1 mr-1.5 h-4.5 w-4.5" />
              {isAddingTeacher ? "Collapse Panel" : "Register Educator"}
            </button>
          </div>

          {isAddingTeacher && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Provision New Faculty Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    placeholder="e.g. Dr. Ada Lovelace"
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder-opacity-50 transition-all focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={e => setTeacherEmail(e.target.value)}
                    placeholder="e.g. lovelace@school.com"
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder-opacity-50 transition-all focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security Password (Default)</label>
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={e => setTeacherPassword(e.target.value)}
                    placeholder="password123"
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder-opacity-50 transition-all focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {addTeacherMutation.isError && (
                <div className="text-red-600 font-semibold text-xs bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {addTeacherMutation.error?.message || 'Error occurred during provisioning. Verify whether email remains unique.'}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => addTeacherMutation.mutate({ name: teacherName, email: teacherEmail, password: teacherPassword })}
                  disabled={addTeacherMutation.isPending || !teacherName.trim() || !teacherEmail.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {addTeacherMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Assign Faculty Registry
                </button>
              </div>
            </div>
          )}

          {loadingTeachers ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/55">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Educator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Credentials State</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTeachers?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                        No active educators found matching details.
                      </td>
                    </tr>
                  ) : filteredTeachers?.map((teacher: any) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase mr-3">
                            {teacher.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{teacher.name}</div>
                            <span className="text-[10px] text-slate-400 font-medium">Approved Faculty</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {teacher.email}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <ShieldCheck className="w-3 h-3" /> Fully Synced
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently terminate Dr./Mr./Ms. ${teacher.name}'s active system access? Assignments will be wiped.`)) {
                              deleteTeacherMutation.mutate(teacher.id);
                            }
                          }}
                          disabled={deleteTeacherMutation.isPending && deleteTeacherMutation.variables === teacher.id}
                          className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50/50 disabled:opacity-50 transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* --- TAB 2: TEACHING ASSIGNMENTS (Linking Teachers to Classes & Subjects) --- */}
      {activeTab === 'assignments' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Faculty Assignments Grid</h3>
              <p className="text-[11px] text-slate-400">Deploy specific teachers to lead results entry for verified subjects and classes.</p>
            </div>
            
            <button
              onClick={() => setIsAddingAssignment(!isAddingAssignment)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow shadow-indigo-100 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              <Plus className="-ml-1 mr-1.5 h-4.5 w-4.5" />
              {isAddingAssignment ? "Collapse Grid" : "Assign Faculty Course"}
            </button>
          </div>

          {isAddingAssignment && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Map Teacher to Subject Classroom</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Select Teacher */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Select Educator</label>
                  <select
                    value={assignTeacherId}
                    onChange={e => setAssignTeacherId(e.target.value)}
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all focus:outline-none"
                  >
                    <option value="">-- Choose Instructor --</option>
                    {teachers?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Class */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Select Classroom / Cohort</label>
                  <select
                    value={assignClassId}
                    onChange={e => setAssignClassId(e.target.value)}
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all focus:outline-none"
                  >
                    <option value="">-- Choose Level --</option>
                    {classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Subject */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">3. Academic Course Module</label>
                  <select
                    value={assignSubjectId}
                    onChange={e => setAssignSubjectId(e.target.value)}
                    className="block w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all focus:outline-none"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => addAssignmentMutation.mutate({ 
                    teacher_id: assignTeacherId, 
                    class_id: assignClassId, 
                    subject_id: assignSubjectId 
                  })}
                  disabled={addAssignmentMutation.isPending || !assignTeacherId || !assignClassId || !assignSubjectId}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {addAssignmentMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Deploy Assignment Linkage
                </button>
              </div>
            </div>
          )}

          {loadingAssignments ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/55">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Class Assigned</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Course Module</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {assignments?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                        No faculty assignments found. Map standard courses to populate.
                      </td>
                    </tr>
                  ) : assignments?.map((assign: any) => (
                    <tr key={assign.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{assign.teacher?.name}</div>
                        <div className="text-[10px] text-slate-400">{assign.teacher?.email}</div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-55 text-blue-700 border border-blue-100">
                          {assign.class?.name || 'Unknown Class'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-800">{assign.subject?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">{assign.subject?.code}</div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            if (window.confirm("Terminate this specific teaching responsibility assignment? The educator will lose access to input grades for this cohort.")) {
                              deleteAssignmentMutation.mutate(assign.id);
                            }
                          }}
                          disabled={deleteAssignmentMutation.isPending && deleteAssignmentMutation.variables === assign.id}
                          className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50/50 disabled:opacity-50 transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* --- TAB 3: CLASSES & SUBJECTS SETUP --- */}
      {activeTab === 'classes_subjects' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CLASSROOMS PANEL */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Classrooms / Grades</h3>
                <p className="text-[10px] text-slate-400">Total levels active: {classes?.length || 0}</p>
              </div>
              <button
                onClick={() => setIsAddingClass(!isAddingClass)}
                className="inline-flex items-center justify-center p-1.5 h-8.5 w-8.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {isAddingClass && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Register New Class Cohort</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Class Label</label>
                    <input
                      type="text"
                      value={className}
                      onChange={e => setClassName(e.target.value)}
                      placeholder="e.g. Science Track A"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Numeric Level Key</label>
                    <input
                      type="text"
                      value={classLevel}
                      onChange={e => setClassLevel(e.target.value)}
                      placeholder="e.g. 10"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => addClassMutation.mutate({ name: className, level: classLevel })}
                    disabled={addClassMutation.isPending || !className || !classLevel}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    Save Classroom
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {classes?.map((cls: any) => (
                <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{cls.name}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Level Code: {cls.level}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete Classroom ${cls.name}? Associated students and tests will be orphaned.`)) {
                        deleteClassMutation.mutate(cls.id);
                      }
                    }}
                    disabled={deleteClassMutation.isPending && deleteClassMutation.variables === cls.id}
                    className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50/50 transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBJECTS DIRECTORY PANEL */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Academic Subjects</h3>
                <p className="text-[10px] text-slate-400">Standard modules setup: {subjects?.length || 0}</p>
              </div>
              <button
                onClick={() => setIsAddingSubject(!isAddingSubject)}
                className="inline-flex items-center justify-center p-1.5 h-8.5 w-8.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {isAddingSubject && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Register Course Subject Code</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={e => setSubjectName(e.target.value)}
                      placeholder="e.g. Physics"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Catalog Code</label>
                    <input
                      type="text"
                      value={subjectCode}
                      onChange={e => setSubjectCode(e.target.value)}
                      placeholder="e.g. PHY201"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => addSubjectMutation.mutate({ name: subjectName, code: subjectCode })}
                    disabled={addSubjectMutation.isPending || !subjectName || !subjectCode}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    Save Catalog Item
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {subjects?.map((sub: any) => (
                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{sub.name}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Catalog Code: {sub.code}</span>
                  </div>
                  {/* For subjects, keep them simple or add delete. Let's let them view. */}
                </div>
              ))}
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
