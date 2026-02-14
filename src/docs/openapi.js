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
          password: { type: 'string' },
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
      UpdateGroupRequest: {
        type: 'object', required: ['name'],
        properties: {
          name: { type: 'string' },
          admins_ids: { type: 'array', items: { type: 'integer' } },
          students_ids: { type: 'array', items: { type: 'integer' } },
          teachers_ids: { type: 'array', items: { type: 'integer' } }
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
      AttendanceSession: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          groupId: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          createdById: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      AttendanceRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          sessionId: { type: 'integer' },
          studentId: { type: 'integer' },
          status: { type: 'string', enum: ['PRESENT','ABSENT','LATE','EXCUSED'] },
          note: { type: 'string', nullable: true },
          takenAt: { type: 'string', format: 'date-time' },
          takenById: { type: 'integer' }
        }
      },
      CreateAttendanceSessionRequest: {
        type: 'object', required: ['groupId'],
        properties: { groupId: { type: 'integer' }, date: { type: 'string', format: 'date' } }
      },
      UpsertAttendanceRecordsRequest: {
        type: 'object', required: ['records'],
        properties: {
          records: {
            type: 'array', items: {
              type: 'object', required: ['studentId','status'],
              properties: {
                studentId: { type: 'integer' },
                status: { type: 'string', enum: ['PRESENT','ABSENT','LATE','EXCUSED'] },
                note: { type: 'string' }
              }
            }
          }
        }
      },
      UpdateAttendanceRecordRequest: {
        type: 'object',
        properties: { status: { type: 'string', enum: ['PRESENT','ABSENT','LATE','EXCUSED'] }, note: { type: 'string' } }
      },
      PaginatedMessages: {
        type: 'object', properties: {
          items: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, senderId: { type: 'integer' }, receiverId: { type: 'integer' }, content: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, isRead: { type: 'boolean' } } } },
          total: { type: 'integer' }
        }
      },
      Banner: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          filename: { type: 'string' },
          originalName: { type: 'string', nullable: true },
          mimeType: { type: 'string', nullable: true },
          size: { type: 'integer', nullable: true },
          createdById: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          url: { type: 'string' }
        }
      },
      BannerListResponse: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
          total: { type: 'integer' }
        }
      },
      PinnedMessage: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          groupId: { type: 'integer' },
          senderId: { type: 'integer' },
          sender: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string', nullable: true }, role: { type: 'string' } } },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          isPinned: { type: 'boolean' },
          isPinnedOriginal: { type: 'boolean' },
          pinnedAt: { type: 'string', format: 'date-time', nullable: true },
          pinnedById: { type: 'integer', nullable: true },
          pinnedBy: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string', nullable: true }, role: { type: 'string' } } }
        }
      },
      PinnedMessageListResponse: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/PinnedMessage' } },
          total: { type: 'integer' }
        }
      },
      GroupWithMembers: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          adminOnly: { type: 'boolean' },
          createdById: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          admins: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          teachers: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          students: { type: 'array', items: { $ref: '#/components/schemas/User' } }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/chat/groups/{groupId}/messages/{messageId}/pin': {
      post: {
        tags: ['Chat'], summary: 'Pin a group message (teacher/student pin)',
        description: 'Pins a regular group message by setting isPinned=1. Does not change isPinnedOriginal.',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'messageId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PinnedMessage' } } } },
          '400': { description: 'Bad request' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Chat'], summary: 'Unpin a group message (teacher/student pin)',
        description: 'Unpins a regular group message by setting isPinned=0. Does not change isPinnedOriginal.',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'messageId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '204': { description: 'Unpinned' },
          '400': { description: 'Bad request' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' }
        }
      }
    },
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
      get: {
        tags: ['Admin'], summary: 'Get user by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, '404': { description: 'Not found' } }
      },
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
        tags: ['Admin'], summary: 'List groups with members grouped by role',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/groups/{id}': {
      get: {
        tags: ['Admin'], summary: 'Get group by id with members grouped by role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } }
      },
      put: {
        tags: ['Admin'], summary: 'Update group name and members (sync members with provided arrays)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateGroupRequest' } } } },
        responses: { '200': { description: 'OK' } }
      },
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
      }
    },
    '/admin/groups/{groupId}/pin/{messageId}': {
      delete: {
        tags: ['Admin'], summary: 'Unpin or delete a specific pinned message in the group',
        description: 'Hard deletes the message if it was originally created as pinned (isPinnedOriginal=1). Rejects request if it is a regular message (isPinnedOriginal=0).',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'messageId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { '204': { description: 'Deleted/Unpinned' }, '400': { description: 'Cannot delete regular message via this endpoint' }, '404': { description: 'Not found' } }
      }
    },
    '/admin/pins': {
      get: {
        tags: ['Admin'], summary: 'List all pinned group messages',
        description: 'Returns only messages that were originally created as pinned (isPinnedOriginal=1).',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PinnedMessageListResponse' } } } } }
      }
    },
    '/admin/groups/{groupId}/pins': {
      get: {
        tags: ['Admin'], summary: 'List pinned group messages by group id',
        description: 'Returns only messages that were originally created as pinned (isPinnedOriginal=1).',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PinnedMessageListResponse' } } } } }
      }
    },
    '/admin/attendance/sessions': {
      post: {
        tags: ['Admin'], summary: 'Create attendance session (one per group/day)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAttendanceSessionRequest' } } } },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceSession' } } } } }
      },
      get: {
        tags: ['Admin'], summary: 'List attendance sessions',
        parameters: [
          { name: 'groupId', in: 'query', schema: { type: 'integer' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/attendance/sessions/{sessionId}': {
      get: {
        tags: ['Admin'], summary: 'Get session with records',
        parameters: [ { name: 'sessionId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/attendance/sessions/{sessionId}/records': {
      post: {
        tags: ['Admin'], summary: 'Upsert attendance records',
        parameters: [ { name: 'sessionId', in: 'path', required: true, schema: { type: 'integer' } } ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpsertAttendanceRecordsRequest' } } } },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/admin/attendance/records/{id}': {
      patch: {
        tags: ['Admin'], summary: 'Update a record',
        parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAttendanceRecordRequest' } } } },
        responses: { '200': { description: 'OK' } }
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
    '/teacher/groups': {
      get: {
        tags: ['Teacher'], summary: 'List my groups with members grouped by role',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/GroupWithMembers' } } } } } }
      }
    },
    '/teacher/groups/{groupId}': {
      get: {
        tags: ['Teacher'], summary: 'Get my group by id with members grouped by role',
        parameters: [ { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupWithMembers' } } } },
          '403': { description: 'Not a member' },
          '404': { description: 'Not found' }
        }
      }
    },
    '/teacher/attendance/sessions': {
      post: {
        tags: ['Teacher'], summary: 'Create attendance session',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAttendanceSessionRequest' } } } },
        responses: { '201': { description: 'Created' } }
      },
      get: {
        tags: ['Teacher'], summary: 'List my group sessions',
        parameters: [
          { name: 'groupId', in: 'query', schema: { type: 'integer' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/teacher/attendance/sessions/{sessionId}': {
      get: {
        tags: ['Teacher'], summary: 'Get session with records (my groups only)',
        parameters: [ { name: 'sessionId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/teacher/attendance/sessions/{sessionId}/records': {
      post: {
        tags: ['Teacher'], summary: 'Upsert attendance records',
        parameters: [ { name: 'sessionId', in: 'path', required: true, schema: { type: 'integer' } } ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpsertAttendanceRecordsRequest' } } } },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/teacher/attendance/records/{id}': {
      patch: {
        tags: ['Teacher'], summary: 'Update a record in my groups',
        parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAttendanceRecordRequest' } } } },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/student/teachers': {
      get: {
        tags: ['Student'], summary: 'List my teachers',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/student/groups': {
      get: {
        tags: ['Student'], summary: 'List my groups with members grouped by role',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/GroupWithMembers' } } } } } }
      }
    },
    '/student/groups/{groupId}': {
      get: {
        tags: ['Student'], summary: 'Get my group by id with members grouped by role',
        parameters: [ { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupWithMembers' } } } },
          '403': { description: 'Not a member' },
          '404': { description: 'Not found' }
        }
      }
    },
    '/student/attendance': {
      get: {
        tags: ['Student'], summary: 'List my attendance',
        parameters: [
          { name: 'groupId', in: 'query', schema: { type: 'integer' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
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
    },
    '/chat/pins': {
      get: {
        tags: ['Chat'], summary: 'List pinned group messages visible to the current user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PinnedMessageListResponse' } } } } }
      }
    },
    '/chat/groups/{groupId}/pin': {
      get: {
        tags: ['Chat'], summary: 'Get all pinned messages for a group',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PinnedMessage' } } } } },
          '403': { description: 'Forbidden' }
        }
      }
    },
    '/chat/users': {
      get: {
        tags: ['Chat'], summary: 'List chat users based on role',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } }
      }
    },
    '/banners': {
      get: {
        tags: ['Banners'], summary: 'List banners',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/BannerListResponse' } } } } }
      },
      post: {
        tags: ['Banners'], summary: 'Upload banner image',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Banner' } } } } }
      }
    },
    '/banners/{id}': {
      get: {
        tags: ['Banners'], summary: 'Get banner by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Banner' } } } }, '404': { description: 'Not found' } }
      },
      delete: {
        tags: ['Banners'], summary: 'Delete banner by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } }
      }
    },
    '/banners/{id}/image': {
      get: {
        tags: ['Banners'], summary: 'Get banner image file by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Image file' }, '404': { description: 'Not found' } }
      }
    }
  }
}

module.exports = openapiSpec
