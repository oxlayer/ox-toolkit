// Tipos baseados nos schemas do banco de dados

export type Company = {
  id: string;
  name: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Exam = {
  id: string;
  companyId: string;
  examName: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Answer = {
  id: string;
  userId: string;
  examId: string;
  externalId: string | null;
  questionId: string;
  s3Url: string;
  duration: string; // decimal como string
  contentType: string;
  fileSize: string; // decimal como string
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EvaluationResult = {
  id: string;
  userId: string;
  examId: string;
  transcriptions: any; // JSONB
  analysisResults: any; // JSONB
  overallScore: string; // decimal como string
  completionStatus: string;
  failureReason: string | null;
  totalAnswers: string; // decimal como string
  transcribedAnswers: string; // decimal como string
  analyzedAnswers: string; // decimal como string
  processingTimeMs: string; // decimal como string
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type EvaluateGroup = {
  id: string;
  idVectorStore: string;
  idCompany: string;
  userIdentifier: string;
  externalIdentifier: string | null;
  type: 'conclusion' | 'evolution';
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Question = {
  id: string;
  examId: string;
  text: string;
  weight: 'high' | 'medium' | 'low';
  type: 'technical' | 'behavioral' | 'situational';
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

// Tipos para criação de novos registros
export type NewExam = Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>;

export type NewQuestion = Omit<Question, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos auxiliares para exibição
export type CompanyWithStats = Company & {
  totalExams?: number;
  totalUsers?: number;
};

export type ExamWithCompany = Exam & {
  companyName?: string;
};

export type AnswerWithDetails = Answer & {
  userName?: string;
  examName?: string;
  questionText?: string;
};

export type EvaluationResultWithDetails = EvaluationResult & {
  userName?: string;
  examName?: string;
  companyName?: string;
};

export type EvaluateGroupWithDetails = EvaluateGroup & {
  companyName?: string;
};

