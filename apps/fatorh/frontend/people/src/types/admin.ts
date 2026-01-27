// Tipos baseados nos schemas do banco de dados

export type Tag = {
  id: string;
  workspaceId: string;
  key: string; // e.g., "Company", "Type", "Level"
  value: string; // e.g., "Nestlé", "Technical", "Senior"
  color: string; // hex color for UI display
  isPrimary: boolean; // if true, this tag is used to identify company/workspace association
  createdAt: Date;
  updatedAt: Date;
};

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
  workspaceId: string;
  examName: string;
  durationMinutes: number;
  tags: string[]; // array of tag IDs
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

// Question format for API (matches backend schema)
export type ApiQuestion = {
  priority: number;
  text: string;
  type: 'text' | 'audio';
};

// Tipos para criação de novos registros
export type NewExam = {
  workspaceId: string;
  examName: string;
  durationMinutes?: number;
  questions: ApiQuestion[];
};

export type NewQuestion = Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'order'>;

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

// WhatsApp Campaign types
export type WhatsAppCampaign = {
  id: string;
  examId: string;
  name: string;
  template: string;
  scheduledDate: Date | null;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  variables: WhatsAppVariable[];
  testUsers: WhatsAppTestUser[];
};

export type WhatsAppVariable = {
  type: 'text';
  text: string;
};

export type WhatsAppTestUser = {
  phoneNumber: string;
  userName: string;
};

export type WhatsAppCampaignRecipient = {
  id: string;
  campaignId: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

export type NewWhatsAppCampaign = Omit<WhatsAppCampaign, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'sentCount' | 'failedCount'> & {
  totalRecipients?: number;
};

export type WhatsAppCampaignWithStats = WhatsAppCampaign & {
  successRate?: number;
};

// Template types
export type TemplateType = 'whatsapp' | 'email';

export type TemplateMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
};

export type TemplateButton = {
  id: string;
  text: string;
  url?: string;
  type: 'url' | 'phone';
};

export type Template = {
  id: string;
  type: TemplateType;
  name: string;
  title: string;
  content: string;
  variables: string[]; // e.g., ["{{1}}", "{{2}}"]
  footer?: string;
  buttons: TemplateButton[];
  media: TemplateMedia[];
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
};

export type NewTemplate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

// Exam Candidate types - links users to exams
export type ExamCandidate = {
  id: string;
  examId: string;
  userId: string;
  status: 'invited' | 'in_progress' | 'completed' | 'failed';
  invitedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewExamCandidate = Omit<ExamCandidate, 'id' | 'createdAt' | 'updatedAt' | 'invitedAt' | 'completedAt'> & {
  invitedAt?: Date;
  completedAt?: Date | null;
  workspaceId: string; // Required - user may belong to multiple workspaces
};

// Tag types
export type NewTag = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;

// Candidate types - a candidate represents a person who can take exams
// Candidates are workspace-scoped and can be assigned to exams via ExamCandidate
export type Candidate = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  externalId?: string; // For integration with external systems
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewCandidate = Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>;

export type CandidateWithExamCount = Candidate & {
  examCount: number;
  lastExamDate?: Date;
};

