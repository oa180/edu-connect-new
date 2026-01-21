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
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string', nullable: true },
          phoneNumber: { type: 'string', nullable: true },
          grade: { type: 'string', nullable: true },
          major: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      LoginRequest: {
        type: 'object', required: ['email','password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { type: 'object', properties: { id: { type: 'integer' }, email: { type: 'string' }, name: { type: 'string', nullable: true }, phoneNumber: { type: 'string', nullable: true }, grade: { type: 'string', nullable: true }, major: { type: 'string', nullable: true }, role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] } } }
        }
      },
      RefreshRequest: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
      LogoutRequest: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
      CreateUserRequest: {
        type: 'object', required: ['email','password','role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] },
          name: { type: 'string' },
          phoneNumber: { type: 'string' },
          grade: { type: 'string', description: 'Required when role = STUDENT' },
          major: { type: 'string', description: 'Required when role = TEACHER' }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['ADMIN','TEACHER','STUDENT'] },
          name: { type: 'string' },
          phoneNumber: { type: 'string' },
          grade: { type: 'string', description: 'Required when role = STUDENT' },
          major: { type: 'string', description: 'Required when role = TEACHER' }
        }
      },
      AssignStudentRequest: { type: 'object', required: ['teacherId','studentId'], properties: { teacherId: { type: 'integer' }, studentId: { type: 'integer' } } },
      TeacherSelfAssignRequest: { type: 'object', required: ['studentId'], properties: { studentId: { type: 'integer' } } },
      CreateGroupRequest: {
        type: 'object', required: ['name'],
        properties: {
          name: { type: 'string' },
          admins_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with ADMIN role only' },
          students_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with STUDENT role' },
          teachers_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with TEACHER role' }
        }
      },
      AddGroupMembersRequest: {
        type: 'object',
        properties: {
          admins_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with ADMIN role only' },
          students_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with STUDENT role' },
          teachers_ids: { type: 'array', items: { type: 'integer' }, description: 'User IDs with TEACHER role' }
        }
      },
      UpdateGroupSettingsRequest: { type: 'object', required: ['adminOnly'], properties: { adminOnly: { type: 'boolean' } } },
      UpdateMemberPostingRequest: { type: 'object', required: ['canPost'], properties: { canPost: { type: 'boolean' } } },
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
      get: {
        tags: ['Admin'], summary: 'List users',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } }
      },
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
    '/admin/groups': {
      post: {
        tags: ['Admin'], summary: 'Create group',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateGroupRequest' } } } },
        responses: { '201': { description: 'Created' } }
      },
      get: {
        tags: ['Admin'], summary: 'List groups',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/groups/{id}': {
      delete: {
        tags: ['Admin'], summary: 'Delete group',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Deleted' } }
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
    '/admin/groups/{id}/members/{userId}': {
      delete: {
        tags: ['Admin'], summary: 'Remove member from group',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { '204': { description: 'Removed' } }
      }
    },
    '/admin/groups/{id}/settings': {
      patch: {
        tags: ['Admin'], summary: 'Update group settings (adminOnly)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateGroupSettingsRequest' } } } },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/groups/{id}/members/{userId}/posting': {
      patch: {
        tags: ['Admin'], summary: 'Enable/disable member posting',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMemberPostingRequest' } } } },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/groups/{groupId}/pin': {
      post: {
        tags: ['Admin'], summary: 'Create a pinned message for the group',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { '201': { description: 'Created' } }
      },
      delete: {
        tags: ['Admin'], summary: 'Unpin current group message',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { '204': { description: 'Unpinned' } }
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
    ,
    '/chat/users': {
      get: {
        tags: ['Chat'], summary: 'List chat users based on role',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } }
      }
    }
  }
}

module.exports = openapiSpec
