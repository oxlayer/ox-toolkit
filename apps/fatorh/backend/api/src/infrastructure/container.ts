/**
 * Dependency Injection Container
 *
 * Sets up all dependencies for the application:
 * - Database connections
 * - Event bus
 * - Cache
 * - Repositories
 * - Use cases
 * - Controllers
 */

import type { PostgresConnection } from '../config/postgres.config.js';
import type { RedisConnection } from '../config/redis.config.js';
import type { EventBus } from '../config/rabbitmq.config.js';
import { createPostgresConnection } from '../config/postgres.config.js';
import { createRedisConnection } from '../config/redis.config.js';
import { createEventBus, setupEventHandlers } from '../config/rabbitmq.config.js';
import { createInMemoryTenantResolver } from '../config/tenancy.config.js';
import * as schema from '../db/schema.js';
import { sql } from 'drizzle-orm';

/**
 * DI Container for ox-globex-api
 */
export class DIContainer {
  private static instance: DIContainer;

  // Infrastructure
  public pg: PostgresConnection;
  public redis: RedisConnection;
  public eventBus: EventBus;
  public tenantResolver: ReturnType<typeof createInMemoryTenantResolver>;

  // Repositories (lazy loaded)
  private _examRepository?: any;
  private _questionRepository?: any;
  private _candidateRepository?: any;
  private _examAssignmentRepository?: any;
  private _examCandidateRepository?: any;
  private _answerRepository?: any;
  private _evaluationResultRepository?: any;
  private _workspaceRepository?: any;
  private _tagRepository?: any;
  private _templateRepository?: any;
  private _whatsappCampaignRepository?: any;

  // Use cases (lazy loaded)
  private _createExamUseCase?: any;
  private _getExamUseCase?: any;
  private _listExamsUseCase?: any;
  private _updateExamUseCase?: any;
  private _deleteExamUseCase?: any;
  private _assignExamUseCase?: any;
  private _bulkEvaluateUseCase?: any;
  private _getEvaluationUseCase?: any;
  private _listEvaluationResultsUseCase?: any;
  private _createWorkspaceUseCase?: any;
  private _getWorkspaceUseCase?: any;
  private _listWorkspacesUseCase?: any;
  private _updateWorkspaceUseCase?: any;
  private _deleteWorkspaceUseCase?: any;
  private _createQuestionUseCase?: any;
  private _getQuestionUseCase?: any;
  private _listQuestionsUseCase?: any;
  private _updateQuestionUseCase?: any;
  private _deleteQuestionUseCase?: any;
  private _createAnswerUseCase?: any;
  private _getAnswerUseCase?: any;
  private _listAnswersUseCase?: any;
  private _updateAnswerUseCase?: any;
  private _deleteAnswerUseCase?: any;
  private _createCandidateUseCase?: any;
  private _getCandidateUseCase?: any;
  private _listCandidatesUseCase?: any;
  private _updateCandidateUseCase?: any;
  private _deleteCandidateUseCase?: any;
  private _createTagUseCase?: any;
  private _getTagUseCase?: any;
  private _listTagsUseCase?: any;
  private _updateTagUseCase?: any;
  private _deleteTagUseCase?: any;
  private _createTemplateUseCase?: any;
  private _getTemplateUseCase?: any;
  private _listTemplatesUseCase?: any;
  private _updateTemplateUseCase?: any;
  private _deleteTemplateUseCase?: any;
  private _createCampaignUseCase?: any;
  private _getCampaignUseCase?: any;
  private _listCampaignsUseCase?: any;
  private _updateCampaignUseCase?: any;
  private _deleteCampaignUseCase?: any;
  private _addExamCandidateUseCase?: any;
  private _getExamCandidateUseCase?: any;
  private _removeExamCandidateUseCase?: any;

  private constructor() {
    // Initialize connections
    this.pg = createPostgresConnection();
    this.redis = createRedisConnection();
    this.tenantResolver = createInMemoryTenantResolver();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Initialize all async resources
   */
  async initialize() {
    console.log('🔧 Initializing infrastructure...');

    // Connect to RabbitMQ
    this.eventBus = createEventBus();
    await setupEventHandlers(this.eventBus);
    console.log('✅ Event bus connected');

    // Test database connection using Drizzle
    await this.pg.db.execute(sql`SELECT 1`);
    console.log('✅ Database connected');

    // Test Redis connection
    await this.redis.set('health', 'ok');
    await this.redis.del('health');
    console.log('✅ Redis connected');

    console.log('');
  }

  // =========================================================================
  // REPOSITORIES
  // =========================================================================

  /**
   * Get exam repository
   */
  get examRepository() {
    if (!this._examRepository) {
      const { PostgresExamRepository } = require('../repositories/exams/postgres-exam.repository.js');
      this._examRepository = new PostgresExamRepository(this.pg.db);
    }
    return this._examRepository;
  }

  /**
   * Get question repository
   */
  get questionRepository() {
    if (!this._questionRepository) {
      const { PostgresQuestionRepository } = require('../repositories/questions/postgres-question.repository.js');
      this._questionRepository = new PostgresQuestionRepository(this.pg.db);
    }
    return this._questionRepository;
  }

  /**
   * Get candidate repository
   */
  get candidateRepository() {
    if (!this._candidateRepository) {
      const { PostgresCandidateRepository } = require('../repositories/candidates/postgres-candidate.repository.js');
      this._candidateRepository = new PostgresCandidateRepository(this.pg.db);
    }
    return this._candidateRepository;
  }

  /**
   * Get exam assignment repository
   */
  get examAssignmentRepository() {
    if (!this._examAssignmentRepository) {
      const { PostgresExamAssignmentRepository } = require('../repositories/exam-assignments/postgres-exam-assignment.repository.js');
      this._examAssignmentRepository = new PostgresExamAssignmentRepository(this.pg.db);
    }
    return this._examAssignmentRepository;
  }

  /**
   * Get exam candidate repository (adapter over exam assignments)
   */
  get examCandidateRepository() {
    if (!this._examCandidateRepository) {
      const { PostgresExamCandidateRepositoryAdapter } = require('../repositories/exam-candidates/postgres-exam-candidate-adapter.repository.js');
      this._examCandidateRepository = new PostgresExamCandidateRepositoryAdapter(this.examAssignmentRepository);
    }
    return this._examCandidateRepository;
  }

  /**
   * Get answer repository
   */
  get answerRepository() {
    if (!this._answerRepository) {
      const { PostgresAnswerRepository } = require('../repositories/answers/postgres-answer.repository.js');
      this._answerRepository = new PostgresAnswerRepository(this.pg.db);
    }
    return this._answerRepository;
  }

  /**
   * Get evaluation result repository
   */
  get evaluationResultRepository() {
    if (!this._evaluationResultRepository) {
      const { PostgresEvaluationResultRepository } = require('../repositories/evaluation-results/postgres-evaluation-result.repository.js');
      this._evaluationResultRepository = new PostgresEvaluationResultRepository(this.pg.db);
    }
    return this._evaluationResultRepository;
  }

  /**
   * Get workspace repository
   */
  get workspaceRepository() {
    if (!this._workspaceRepository) {
      const { PostgresWorkspaceRepository } = require('../repositories/workspaces/postgres-workspace.repository.js');
      this._workspaceRepository = new PostgresWorkspaceRepository(this.pg.db);
    }
    return this._workspaceRepository;
  }

  /**
   * Get tag repository
   */
  get tagRepository() {
    if (!this._tagRepository) {
      const { PostgresTagRepository } = require('../repositories/tags/postgres-tag.repository.js');
      this._tagRepository = new PostgresTagRepository(this.pg.db);
    }
    return this._tagRepository;
  }

  /**
   * Get template repository
   */
  get templateRepository() {
    if (!this._templateRepository) {
      const { PostgresTemplateRepository } = require('../repositories/templates/postgres-template.repository.js');
      this._templateRepository = new PostgresTemplateRepository(this.pg.db);
    }
    return this._templateRepository;
  }

  /**
   * Get WhatsApp campaign repository
   */
  get whatsappCampaignRepository() {
    if (!this._whatsappCampaignRepository) {
      const { PostgresWhatsAppCampaignRepository } = require('../repositories/campaigns/postgres-whatsapp-campaign.repository.js');
      this._whatsappCampaignRepository = new PostgresWhatsAppCampaignRepository(this.pg.db);
    }
    return this._whatsappCampaignRepository;
  }

  // =========================================================================
  // USE CASES
  // =========================================================================

  /**
   * Get create exam use case
   */
  get createExamUseCase() {
    if (!this._createExamUseCase) {
      const { CreateExamUseCase } = require('../use-cases/exams/create-exam.use-case.js');
      this._createExamUseCase = new CreateExamUseCase(
        this.examRepository,
        this.questionRepository,
        this.eventBus
      );
    }
    return this._createExamUseCase;
  }

  /**
   * Get get exam use case
   */
  get getExamUseCase() {
    if (!this._getExamUseCase) {
      const { GetExamUseCase } = require('../use-cases/exams/get-exam.use-case.js');
      this._getExamUseCase = new GetExamUseCase(
        this.examRepository,
        this.questionRepository
      );
    }
    return this._getExamUseCase;
  }

  /**
   * Get delete exam use case
   */
  get deleteExamUseCase() {
    if (!this._deleteExamUseCase) {
      const { DeleteExamUseCase } = require('../use-cases/exams/delete-exam.use-case.js');
      this._deleteExamUseCase = new DeleteExamUseCase(
        this.examRepository,
        this.questionRepository,
        this.eventBus
      );
    }
    return this._deleteExamUseCase;
  }

  /**
   * Get list exams use case
   */
  get listExamsUseCase() {
    if (!this._listExamsUseCase) {
      const { ListExamsUseCase } = require('../use-cases/exams/list-exams.use-case.js');
      this._listExamsUseCase = new ListExamsUseCase(
        this.examRepository
      );
    }
    return this._listExamsUseCase;
  }

  /**
   * Get update exam use case
   */
  get updateExamUseCase() {
    if (!this._updateExamUseCase) {
      const { UpdateExamUseCase } = require('../use-cases/exams/update-exam.use-case.js');
      this._updateExamUseCase = new UpdateExamUseCase(
        this.examRepository
      );
    }
    return this._updateExamUseCase;
  }

  /**
   * Get assign exam use case
   */
  get assignExamUseCase() {
    if (!this._assignExamUseCase) {
      const { AssignExamUseCase } = require('../use-cases/exam-assignments/assign-exam.use-case.js');
      this._assignExamUseCase = new AssignExamUseCase(
        this.examAssignmentRepository,
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._assignExamUseCase;
  }

  /**
   * Get bulk evaluate use case
   */
  get bulkEvaluateUseCase() {
    if (!this._bulkEvaluateUseCase) {
      const { BulkEvaluateUseCase } = require('../use-cases/evaluations/bulk-evaluate.use-case.js');
      this._bulkEvaluateUseCase = new BulkEvaluateUseCase(
        this.candidateRepository,
        this.examAssignmentRepository,
        this.answerRepository,
        this.evaluationResultRepository,
        this.eventBus
      );
    }
    return this._bulkEvaluateUseCase;
  }

  /**
   * Get get evaluation use case
   */
  get getEvaluationUseCase() {
    if (!this._getEvaluationUseCase) {
      const { GetEvaluationUseCase } = require('../use-cases/evaluations/get-evaluation.use-case.js');
      this._getEvaluationUseCase = new GetEvaluationUseCase(
        this.evaluationResultRepository
      );
    }
    return this._getEvaluationUseCase;
  }

  /**
   * Get list evaluation results use case
   */
  get listEvaluationResultsUseCase() {
    if (!this._listEvaluationResultsUseCase) {
      const { ListEvaluationResultsUseCase } = require('../use-cases/evaluations/list-evaluation-results.use-case.js');
      this._listEvaluationResultsUseCase = new ListEvaluationResultsUseCase(
        this.evaluationResultRepository
      );
    }
    return this._listEvaluationResultsUseCase;
  }

  /**
   * Get create workspace use case
   */
  get createWorkspaceUseCase() {
    if (!this._createWorkspaceUseCase) {
      const { CreateWorkspaceUseCase } = require('../use-cases/workspaces/create-workspace.use-case.js');
      this._createWorkspaceUseCase = new CreateWorkspaceUseCase(
        this.workspaceRepository
      );
    }
    return this._createWorkspaceUseCase;
  }

  /**
   * Get get workspace use case
   */
  get getWorkspaceUseCase() {
    if (!this._getWorkspaceUseCase) {
      const { GetWorkspaceUseCase } = require('../use-cases/workspaces/get-workspace.use-case.js');
      this._getWorkspaceUseCase = new GetWorkspaceUseCase(
        this.workspaceRepository
      );
    }
    return this._getWorkspaceUseCase;
  }

  /**
   * Get list workspaces use case
   */
  get listWorkspacesUseCase() {
    if (!this._listWorkspacesUseCase) {
      const { ListWorkspacesUseCase } = require('../use-cases/workspaces/list-workspaces.use-case.js');
      this._listWorkspacesUseCase = new ListWorkspacesUseCase(
        this.workspaceRepository
      );
    }
    return this._listWorkspacesUseCase;
  }

  /**
   * Get update workspace use case
   */
  get updateWorkspaceUseCase() {
    if (!this._updateWorkspaceUseCase) {
      const { UpdateWorkspaceUseCase } = require('../use-cases/workspaces/update-workspace.use-case.js');
      this._updateWorkspaceUseCase = new UpdateWorkspaceUseCase(
        this.workspaceRepository
      );
    }
    return this._updateWorkspaceUseCase;
  }

  /**
   * Get delete workspace use case
   */
  get deleteWorkspaceUseCase() {
    if (!this._deleteWorkspaceUseCase) {
      const { DeleteWorkspaceUseCase } = require('../use-cases/workspaces/delete-workspace.use-case.js');
      this._deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(
        this.workspaceRepository
      );
    }
    return this._deleteWorkspaceUseCase;
  }

  /**
   * Get create question use case
   */
  get createQuestionUseCase() {
    if (!this._createQuestionUseCase) {
      const { CreateQuestionUseCase } = require('../use-cases/questions/create-question.use-case.js');
      this._createQuestionUseCase = new CreateQuestionUseCase(
        this.questionRepository
      );
    }
    return this._createQuestionUseCase;
  }

  /**
   * Get get question use case
   */
  get getQuestionUseCase() {
    if (!this._getQuestionUseCase) {
      const { GetQuestionUseCase } = require('../use-cases/questions/get-question.use-case.js');
      this._getQuestionUseCase = new GetQuestionUseCase(
        this.questionRepository
      );
    }
    return this._getQuestionUseCase;
  }

  /**
   * Get list questions use case
   */
  get listQuestionsUseCase() {
    if (!this._listQuestionsUseCase) {
      const { ListQuestionsUseCase } = require('../use-cases/questions/list-questions.use-case.js');
      this._listQuestionsUseCase = new ListQuestionsUseCase(
        this.questionRepository
      );
    }
    return this._listQuestionsUseCase;
  }

  /**
   * Get update question use case
   */
  get updateQuestionUseCase() {
    if (!this._updateQuestionUseCase) {
      const { UpdateQuestionUseCase } = require('../use-cases/questions/update-question.use-case.js');
      this._updateQuestionUseCase = new UpdateQuestionUseCase(
        this.questionRepository
      );
    }
    return this._updateQuestionUseCase;
  }

  /**
   * Get delete question use case
   */
  get deleteQuestionUseCase() {
    if (!this._deleteQuestionUseCase) {
      const { DeleteQuestionUseCase } = require('../use-cases/questions/delete-question.use-case.js');
      this._deleteQuestionUseCase = new DeleteQuestionUseCase(
        this.questionRepository
      );
    }
    return this._deleteQuestionUseCase;
  }

  /**
   * Get create answer use case
   */
  get createAnswerUseCase() {
    if (!this._createAnswerUseCase) {
      const { CreateAnswerUseCase } = require('../use-cases/answers/create-answer.use-case.js');
      this._createAnswerUseCase = new CreateAnswerUseCase(
        this.answerRepository
      );
    }
    return this._createAnswerUseCase;
  }

  /**
   * Get get answer use case
   */
  get getAnswerUseCase() {
    if (!this._getAnswerUseCase) {
      const { GetAnswerUseCase } = require('../use-cases/answers/get-answer.use-case.js');
      this._getAnswerUseCase = new GetAnswerUseCase(
        this.answerRepository
      );
    }
    return this._getAnswerUseCase;
  }

  /**
   * Get list answers use case
   */
  get listAnswersUseCase() {
    if (!this._listAnswersUseCase) {
      const { ListAnswersUseCase } = require('../use-cases/answers/list-answers.use-case.js');
      this._listAnswersUseCase = new ListAnswersUseCase(
        this.answerRepository
      );
    }
    return this._listAnswersUseCase;
  }

  /**
   * Get update answer use case
   */
  get updateAnswerUseCase() {
    if (!this._updateAnswerUseCase) {
      const { UpdateAnswerUseCase } = require('../use-cases/answers/update-answer.use-case.js');
      this._updateAnswerUseCase = new UpdateAnswerUseCase(
        this.answerRepository
      );
    }
    return this._updateAnswerUseCase;
  }

  /**
   * Get delete answer use case
   */
  get deleteAnswerUseCase() {
    if (!this._deleteAnswerUseCase) {
      const { DeleteAnswerUseCase } = require('../use-cases/answers/delete-answer.use-case.js');
      this._deleteAnswerUseCase = new DeleteAnswerUseCase(
        this.answerRepository
      );
    }
    return this._deleteAnswerUseCase;
  }

  /**
   * Get create candidate use case
   */
  get createCandidateUseCase() {
    if (!this._createCandidateUseCase) {
      const { CreateCandidateUseCase } = require('../use-cases/candidates/create-candidate.use-case.js');
      this._createCandidateUseCase = new CreateCandidateUseCase(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._createCandidateUseCase;
  }

  /**
   * Get get candidate use case
   */
  get getCandidateUseCase() {
    if (!this._getCandidateUseCase) {
      const { GetCandidateUseCase } = require('../use-cases/candidates/get-candidate.use-case.js');
      this._getCandidateUseCase = new GetCandidateUseCase(
        this.candidateRepository
      );
    }
    return this._getCandidateUseCase;
  }

  /**
   * Get list candidates use case
   */
  get listCandidatesUseCase() {
    if (!this._listCandidatesUseCase) {
      const { ListCandidatesUseCase } = require('../use-cases/candidates/list-candidates.use-case.js');
      this._listCandidatesUseCase = new ListCandidatesUseCase(
        this.candidateRepository
      );
    }
    return this._listCandidatesUseCase;
  }

  /**
   * Get update candidate use case
   */
  get updateCandidateUseCase() {
    if (!this._updateCandidateUseCase) {
      const { UpdateCandidateUseCase } = require('../use-cases/candidates/update-candidate.use-case.js');
      this._updateCandidateUseCase = new UpdateCandidateUseCase(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._updateCandidateUseCase;
  }

  /**
   * Get delete candidate use case
   */
  get deleteCandidateUseCase() {
    if (!this._deleteCandidateUseCase) {
      const { DeleteCandidateUseCase } = require('../use-cases/candidates/delete-candidate.use-case.js');
      this._deleteCandidateUseCase = new DeleteCandidateUseCase(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._deleteCandidateUseCase;
  }


  /**
   * Get create tag use case
   */
  get createTagUseCase() {
    if (!this._createTagUseCase) {
      const { CreateTagUseCase } = require('../use-cases/tags/create-tag.use-case.js');
      this._createTagUseCase = new CreateTagUseCase(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._createTagUseCase;
  }

  /**
   * Get get tag use case
   */
  get getTagUseCase() {
    if (!this._getTagUseCase) {
      const { GetTagUseCase } = require('../use-cases/tags/get-tag.use-case.js');
      this._getTagUseCase = new GetTagUseCase(
        this.tagRepository
      );
    }
    return this._getTagUseCase;
  }

  /**
   * Get list tags use case
   */
  get listTagsUseCase() {
    if (!this._listTagsUseCase) {
      const { ListTagsUseCase } = require('../use-cases/tags/list-tags.use-case.js');
      this._listTagsUseCase = new ListTagsUseCase(
        this.tagRepository
      );
    }
    return this._listTagsUseCase;
  }

  /**
   * Get update tag use case
   */
  get updateTagUseCase() {
    if (!this._updateTagUseCase) {
      const { UpdateTagUseCase } = require('../use-cases/tags/update-tag.use-case.js');
      this._updateTagUseCase = new UpdateTagUseCase(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._updateTagUseCase;
  }

  /**
   * Get delete tag use case
   */
  get deleteTagUseCase() {
    if (!this._deleteTagUseCase) {
      const { DeleteTagUseCase } = require('../use-cases/tags/delete-tag.use-case.js');
      this._deleteTagUseCase = new DeleteTagUseCase(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._deleteTagUseCase;
  }

  /**
   * Get create template use case
   */
  get createTemplateUseCase() {
    if (!this._createTemplateUseCase) {
      const { CreateTemplateUseCase } = require('../use-cases/templates/create-template.use-case.js');
      this._createTemplateUseCase = new CreateTemplateUseCase(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._createTemplateUseCase;
  }

  /**
   * Get get template use case
   */
  get getTemplateUseCase() {
    if (!this._getTemplateUseCase) {
      const { GetTemplateUseCase } = require('../use-cases/templates/get-template.use-case.js');
      this._getTemplateUseCase = new GetTemplateUseCase(
        this.templateRepository
      );
    }
    return this._getTemplateUseCase;
  }

  /**
   * Get list templates use case
   */
  get listTemplatesUseCase() {
    if (!this._listTemplatesUseCase) {
      const { ListTemplatesUseCase } = require('../use-cases/templates/list-templates.use-case.js');
      this._listTemplatesUseCase = new ListTemplatesUseCase(
        this.templateRepository
      );
    }
    return this._listTemplatesUseCase;
  }

  /**
   * Get update template use case
   */
  get updateTemplateUseCase() {
    if (!this._updateTemplateUseCase) {
      const { UpdateTemplateUseCase } = require('../use-cases/templates/update-template.use-case.js');
      this._updateTemplateUseCase = new UpdateTemplateUseCase(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._updateTemplateUseCase;
  }

  /**
   * Get delete template use case
   */
  get deleteTemplateUseCase() {
    if (!this._deleteTemplateUseCase) {
      const { DeleteTemplateUseCase } = require('../use-cases/templates/delete-template.use-case.js');
      this._deleteTemplateUseCase = new DeleteTemplateUseCase(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._deleteTemplateUseCase;
  }

  /**
   * Get create campaign use case
   */
  get createCampaignUseCase() {
    if (!this._createCampaignUseCase) {
      const { CreateWhatsAppCampaignUseCase } = require('../use-cases/campaigns/create-whatsapp-campaign.use-case.js');
      this._createCampaignUseCase = new CreateWhatsAppCampaignUseCase(
        this.whatsappCampaignRepository,
        this.templateRepository,
        this.eventBus
      );
    }
    return this._createCampaignUseCase;
  }

  /**
   * Get get campaign use case
   */
  get getCampaignUseCase() {
    if (!this._getCampaignUseCase) {
      const { GetWhatsAppCampaignUseCase } = require('../use-cases/campaigns/get-whatsapp-campaign.use-case.js');
      this._getCampaignUseCase = new GetWhatsAppCampaignUseCase(
        this.whatsappCampaignRepository
      );
    }
    return this._getCampaignUseCase;
  }

  /**
   * Get list campaigns use case
   */
  get listCampaignsUseCase() {
    if (!this._listCampaignsUseCase) {
      const { ListWhatsAppCampaignsUseCase } = require('../use-cases/campaigns/list-whatsapp-campaigns.use-case.js');
      this._listCampaignsUseCase = new ListWhatsAppCampaignsUseCase(
        this.whatsappCampaignRepository
      );
    }
    return this._listCampaignsUseCase;
  }

  /**
   * Get update campaign use case
   */
  get updateCampaignUseCase() {
    if (!this._updateCampaignUseCase) {
      const { UpdateWhatsAppCampaignUseCase } = require('../use-cases/campaigns/update-whatsapp-campaign.use-case.js');
      this._updateCampaignUseCase = new UpdateWhatsAppCampaignUseCase(
        this.whatsappCampaignRepository,
        this.templateRepository,
        this.eventBus
      );
    }
    return this._updateCampaignUseCase;
  }

  /**
   * Get delete campaign use case
   */
  get deleteCampaignUseCase() {
    if (!this._deleteCampaignUseCase) {
      const { DeleteWhatsAppCampaignUseCase } = require('../use-cases/campaigns/delete-whatsapp-campaign.use-case.js');
      this._deleteCampaignUseCase = new DeleteWhatsAppCampaignUseCase(
        this.whatsappCampaignRepository,
        this.eventBus
      );
    }
    return this._deleteCampaignUseCase;
  }

  /**
   * Get add exam candidate use case
   */
  get addExamCandidateUseCase() {
    if (!this._addExamCandidateUseCase) {
      const { AddExamCandidateUseCase } = require('../use-cases/exam-candidates/add-exam-candidate.use-case.js');
      this._addExamCandidateUseCase = new AddExamCandidateUseCase(
        this.examCandidateRepository,
        this.candidateRepository
      );
    }
    return this._addExamCandidateUseCase;
  }

  /**
   * Get get exam candidate use case
   */
  get getExamCandidateUseCase() {
    if (!this._getExamCandidateUseCase) {
      const { GetExamCandidateUseCase } = require('../use-cases/exam-candidates/get-exam-candidate.use-case.js');
      this._getExamCandidateUseCase = new GetExamCandidateUseCase(
        this.examCandidateRepository
      );
    }
    return this._getExamCandidateUseCase;
  }

  /**
   * Get remove exam candidate use case
   */
  get removeExamCandidateUseCase() {
    if (!this._removeExamCandidateUseCase) {
      const { RemoveExamCandidateUseCase } = require('../use-cases/exam-candidates/remove-exam-candidate.use-case.js');
      this._removeExamCandidateUseCase = new RemoveExamCandidateUseCase(
        this.examCandidateRepository
      );
    }
    return this._removeExamCandidateUseCase;
  }

  // =========================================================================
  // CONTROLLERS
  // =========================================================================

  /**
   * Create exams controller
   */
  createExamsController() {
    const { ExamsController } = require('../controllers/exams/exams.controller.js');
    return new ExamsController(
      this.createExamUseCase,
      this.getExamUseCase,
      this.listExamsUseCase,
      this.deleteExamUseCase,
      this.updateExamUseCase
    );
  }

  /**
   * Create evaluations controller
   */
  createEvaluationsController() {
    const { EvaluationsController } = require('../controllers/evaluations/evaluations.controller.js');
    return new EvaluationsController(
      this.assignExamUseCase,
      this.bulkEvaluateUseCase,
      this.getEvaluationUseCase,
      this.listEvaluationResultsUseCase
    );
  }

  /**
   * Create workspaces controller
   */
  createWorkspacesController() {
    const { WorkspacesController } = require('../controllers/workspaces/workspaces.controller.js');
    return new WorkspacesController(
      this.createWorkspaceUseCase,
      this.getWorkspaceUseCase,
      this.listWorkspacesUseCase,
      this.updateWorkspaceUseCase,
      this.deleteWorkspaceUseCase
    );
  }

  /**
   * Create questions controller
   */
  createQuestionsController() {
    const { QuestionsController } = require('../controllers/questions/questions.controller.js');
    return new QuestionsController(
      this.createQuestionUseCase,
      this.getQuestionUseCase,
      this.listQuestionsUseCase,
      this.updateQuestionUseCase,
      this.deleteQuestionUseCase
    );
  }

  /**
   * Create answers controller
   */
  createAnswersController() {
    const { AnswersController } = require('../controllers/answers/answers.controller.js');
    return new AnswersController(
      this.createAnswerUseCase,
      this.getAnswerUseCase,
      this.listAnswersUseCase,
      this.updateAnswerUseCase,
      this.deleteAnswerUseCase
    );
  }

  /**
   * Create candidates controller
   */
  createCandidatesController() {
    const { CandidatesController } = require('../controllers/candidates/candidates.controller.js');
    return new CandidatesController(
      this.createCandidateUseCase,
      this.getCandidateUseCase,
      this.listCandidatesUseCase,
      this.updateCandidateUseCase,
      this.deleteCandidateUseCase
    );
  }

  /**
   * Create admin controller
   */
  createAdminController() {
    const { createAdminController } = require('../controllers/admin/controller.js');
    return createAdminController();
  }

  /**
   * Create tags controller
   */
  createTagsController() {
    const { TagsController } = require('../controllers/tags/tags.controller.js');
    return new TagsController(
      this.createTagUseCase,
      this.getTagUseCase,
      this.listTagsUseCase,
      this.updateTagUseCase,
      this.deleteTagUseCase
    );
  }

  /**
   * Create templates controller
   */
  createTemplatesController() {
    const { TemplatesController } = require('../controllers/templates/templates.controller.js');
    return new TemplatesController(
      this.createTemplateUseCase,
      this.getTemplateUseCase,
      this.listTemplatesUseCase,
      this.updateTemplateUseCase,
      this.deleteTemplateUseCase
    );
  }

  /**
   * Create campaigns controller
   */
  createCampaignsController() {
    const { CampaignsController } = require('../controllers/campaigns/campaigns.controller.js');
    return new CampaignsController(
      this.createCampaignUseCase,
      this.getCampaignUseCase,
      this.listCampaignsUseCase,
      this.updateCampaignUseCase,
      this.deleteCampaignUseCase
    );
  }

  /**
   * Create exam candidates controller
   */
  createExamCandidatesController() {
    const { ExamCandidatesController } = require('../controllers/exam-candidates/exam-candidates.controller.js');
    return new ExamCandidatesController(
      this.addExamCandidateUseCase,
      this.getExamCandidateUseCase,
      this.removeExamCandidateUseCase
    );
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Cleanup all resources
   */
  async shutdown() {
    console.log('🔧 Shutting down infrastructure...');

    await this.eventBus.disconnect();
    console.log('✅ Event bus disconnected');

    await this.pg.close();
    console.log('✅ Database disconnected');

    await this.redis.quit();
    console.log('✅ Redis disconnected');
  }
}

/**
 * Get container instance
 */
export function getContainer(): DIContainer {
  return DIContainer.getInstance();
}
