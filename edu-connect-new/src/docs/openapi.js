const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Edu Connect API',
    version: '1.0.0',
    description: 'REST API for Edu Connect with Auth, RBAC, and Chat',
  },
  servers: [
    { url: '/api' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object', required: ['email','password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { type: 'object', properties: { id: { type: 'integer' }, email: { type: 'string' }, role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] } } }
        }
      },
      RefreshRequest: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
      LogoutRequest: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
      CreateUserRequest: {
        type: 'object', required: ['email','password','role'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 }, role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] } }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 }, role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] } }
      },
      AssignStudentRequest: { type: 'object', required: ['teacherId','studentId'], properties: { teacherId: { type: 'integer' }, studentId: { type: 'integer' } } },
      TeacherSelfAssignRequest: { type: 'object', required: ['studentId'], properties: { studentId: { type: 'integer' } } },
      CreateGroupRequest: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      AddGroupMembersRequest: { type: 'object', required: ['userIds'], properties: { userIds: { type: 'array', items: { type: 'integer' } } } },
      PaginatedMessages: {
        type: 'object', properties: {
          items: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, senderId: { type: 'integer' }, receiverId: { type: 'integer' }, content: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, isRead: { type: 'boolean' } } } },
          total: { type: 'integer' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login with email and password',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { '200': { description: 'Tokens and user', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } } }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Refresh access token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
        responses: { '200': { description: 'New access token' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'], summary: 'Logout (revoke refresh token)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutRequest' } } } },
        responses: { '204': { description: 'Revoked' } }
      }
    },
    '/admin/users': {
      post: {
        tags: ['Admin'], summary: 'Create user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } } },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/admin/users/{id}': {
      put: {
        tags: ['Admin'], summary: 'Update user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } } },
        responses: { '200': { description: 'Updated' } }
      },
      delete: {
        tags: ['Admin'], summary: 'Delete user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Deleted' } }
      }
    },
    '/admin/assign-student': {
      post: {
        tags: ['Admin'], summary: 'Assign student to teacher',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignStudentRequest' } } } },
        responses: { '200': { description: 'Assigned' } }
      }
    },
    '/admin/groups': {
      post: {
        tags: ['Admin'], summary: 'Create group',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateGroupRequest' } } } },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/admin/groups/{id}/members': {
      post: {
        tags: ['Admin'], summary: 'Add members to group',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddGroupMembersRequest' } } } },
        responses: { '200': { description: 'Updated' } }
      }
    },
    '/teacher/students': {
      get: {
        tags: ['Teacher'], summary: 'List my students',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/teacher/assign-student': {
      post: {
        tags: ['Teacher'], summary: 'Assign a student to me',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeacherSelfAssignRequest' } } } },
        responses: { '201': { description: 'Assigned' } }
      }
    },
    '/student/teachers': {
      get: {
        tags: ['Student'], summary: 'List my teachers',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/chat/private/{userId}': {
      get: {
        tags: ['Chat'], summary: 'Get private messages with user',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedMessages' } } } } }
      }
    },
    '/chat/groups/{groupId}': {
      get: {
        tags: ['Chat'], summary: 'Get group messages',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedMessages' } } } } }
      }
    }
  }
}

module.exports = openapiSpec
