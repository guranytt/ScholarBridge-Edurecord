export type Role = 'admin' | 'teacher' | 'student' | null;

export interface Score {
  ca: number;
  exam: number;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  scores: Record<string, Score>; // key is subjectId
}

export interface Class {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[]; // subjectIds they teach
  classes: string[]; // classIds they teach
}
