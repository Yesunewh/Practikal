import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/** Row from GET /users/pendingStatus */
export type PendingApplicantRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string | null;
  status: string;
  org_id?: string | null;
  dept_id?: string | null;
  createdAt?: string;
};

/** Dev: use `/api` + Vite proxy to backend. Prod: set VITE_API_BASE_URL (e.g. https://api.example.com/api). */
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5050/api');

export const practikalApi = createApi({
  reducerPath: 'practikalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('practikal-token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'PendingApplicants',
    'Challenge',
    'Request',
    'Organization',
    'Department',
    'Unit',
    'Role',
    'Permission',
    'Gamification',
  ],

  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        // Backend route: POST /api/users/register-applicant
        url: '/users/register-applicant',
        method: 'POST',
        body: userData,
      }),
    }),
    // Organizations
    getOrganizations: builder.query({
      query: () => '/organizations',
      providesTags: ['Organization'],
    }),
    createOrganization: builder.mutation({
      query: (orgData) => ({
        url: '/organizations',
        method: 'POST',
        body: orgData,
      }),
      invalidatesTags: ['Organization'],
    }),
    // Departments
    getDepartments: builder.query({
      // Backend route: GET /api/departments/organization/:orgId (or /organization)
      query: (orgId?: string) => orgId ? `/departments/organization/${orgId}` : '/departments/organization',
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation({
      query: (deptData) => ({
        // Backend route: POST /api/departments
        url: '/departments',
        method: 'POST',
        body: deptData,
      }),
      invalidatesTags: ['Department'],
    }),
    getDepartmentById: builder.query({
      query: (id: string) => `/departments/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Department', id }],
    }),
    updateDepartment: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        name?: string;
        description?: string | null;
        status?: string;
        unit_id?: string | null;
      }) => ({
        url: `/departments/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Department'],
    }),

    // Units (Branches)
    getUnitTree: builder.query({
      query: (orgId?: string) => orgId ? `/units/tree?org_id=${orgId}` : '/units/tree',
      providesTags: ['Unit'],
    }),
    createUnit: builder.mutation({
      query: (unitData) => ({
        url: '/units',
        method: 'POST',
        body: unitData,
      }),
      invalidatesTags: ['Unit'],
    }),
    getUnitTypes: builder.query({
      query: (orgId?: string) => orgId ? `/units/types?org_id=${orgId}` : '/units/types',
      providesTags: ['Unit'],
    }),
    createUnitType: builder.mutation({
      query: (typeData) => ({
        url: '/units/types',
        method: 'POST',
        body: typeData,
      }),
      invalidatesTags: ['Unit'],
    }),

    // Permissions
    getAvailablePermissions: builder.query({
      query: (orgId?: string) => orgId ? `/permissions?org_id=${orgId}` : '/permissions',
      providesTags: ['Permission'],
    }),
    allocatePermission: builder.mutation({
      query: ({ permissionId, ...body }) => ({
        url: `/permissions/${permissionId}/allocate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),
    bulkAllocatePermissions: builder.mutation({
      query: ({ orgId, ...body }) => ({
        url: `/permissions/organizations/${orgId}/bulk`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),

    // Roles
    getRoles: builder.query({
      query: ({ orgId, includeSystem }) => {
        const url = '/roles';
        const params = new URLSearchParams();
        if (orgId) params.append('org_id', orgId);
        if (includeSystem !== undefined) params.append('includeSystem', includeSystem);
        return `${url}?${params.toString()}`;
      },
      providesTags: ['Role'],
    }),
    createRole: builder.mutation({
      query: (roleData) => ({
        url: '/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Role'],
    }),

    // User Management
    getUsers: builder.query({
      query: (arg?: string | { org_id?: string; dept_id?: string }) => {
        const params = new URLSearchParams();
        if (typeof arg === 'string') {
          if (arg) params.set('org_id', arg);
        } else if (arg && typeof arg === 'object') {
          if (arg.org_id) params.set('org_id', arg.org_id);
          if (arg.dept_id) params.set('dept_id', arg.dept_id);
        }
        const qs = params.toString();
        return qs ? `/users?${qs}` : '/users';
      },
      providesTags: ['User'],
    }),
    adminCreateUser: builder.mutation({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User', 'Department'],
    }),
    adminUpdateUserScope: builder.mutation({
      query: ({
        userId,
        ...body
      }: {
        userId: string;
        org_id?: string | null;
        dept_id?: string | null;
        user_type?: string;
      }) => ({
        url: `/users/${userId}/admin-scope`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User', 'Department'],
    }),
    resetUserPassword: builder.mutation({
      query: (userId) => ({
        // Backend route: PATCH /api/users/resetPasswordById/:userId
        url: `/users/resetPasswordById/${userId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User', 'Department'],
    }),
    deactivateUser: builder.mutation({
      query: (userId) => ({
        // Backend route: PATCH /api/users/:userId/deactivate
        url: `/users/${userId}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User', 'Department'],
    }),
    activateUser: builder.mutation({
      query: (userId) => ({
        // Backend route: PATCH /api/users/:userId/activate
        url: `/users/${userId}/activate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User', 'Department'],
    }),
    getPendingApplicants: builder.query<
      { success: boolean; users: PendingApplicantRow[] },
      void
    >({
      query: () => '/users/pendingStatus',
      providesTags: ['PendingApplicants', 'User'],
    }),
    approveApplicant: builder.mutation({
      query: ({
        userId,
        ...body
      }: {
        userId: string;
        org_id?: string | null;
        dept_id?: string | null;
        unit_id: string;
        role_id: string;
      }) => ({
        url: `/users/${userId}/approve-applicant`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PendingApplicants', 'User', 'Department'],
    }),
    rejectApplicant: builder.mutation<{ success: boolean; message?: string }, string>({
      query: (userId) => ({
        url: `/users/${userId}/reject-applicant`,
        method: 'POST',
      }),
      invalidatesTags: ['PendingApplicants', 'User'],
    }),

    // Gamification (default on; set VITE_USE_GAMIFICATION_API=false for mock-only)
    getGamificationChallenges: builder.query({
      query: (arg?: {
        category?: string;
        difficulty?: string;
        org_id?: string;
        dept_id?: string;
        /** Admin exam bank: include inactive challenges + attempt counts */
        for_exam_bank?: boolean;
      }) => {
        const params = new URLSearchParams();
        if (arg?.category) params.set('category', arg.category);
        if (arg?.difficulty) params.set('difficulty', arg.difficulty);
        if (arg?.org_id) params.set('org_id', arg.org_id);
        if (arg?.dept_id) params.set('dept_id', arg.dept_id);
        if (arg?.for_exam_bank) params.set('for_exam_bank', '1');
        const qs = params.toString();
        return `/gamification/challenges${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Challenge'],
    }),
    getGamificationChallengeById: builder.query({
      query: (id: string) => `/gamification/challenges/${id}`,
      providesTags: ['Challenge'],
    }),
    completeGamificationChallenge: builder.mutation({
      query: ({
        challengeId,
        ...body
      }: {
        challengeId: string;
        score?: number;
        passed?: boolean;
        timeSpentSec?: number;
        stepAnswers?: unknown;
      }) => ({
        url: `/gamification/challenges/${challengeId}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Challenge', 'User', 'Gamification'],
    }),
    getGamificationProgressMe: builder.query({
      query: () => '/gamification/progress/me',
      providesTags: ['User', 'Gamification'],
    }),
    getGamificationMyAssignments: builder.query({
      query: () => '/gamification/assignments/me',
      providesTags: ['Gamification'],
    }),
    getGamificationTrainingAssignmentsAdmin: builder.query({
      query: (arg?: { org_id?: string }) => {
        const params = new URLSearchParams();
        if (arg?.org_id) params.set('org_id', arg.org_id);
        const qs = params.toString();
        return `/gamification/assignments${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Gamification'],
    }),
    createGamificationTrainingAssignment: builder.mutation<
      { success: boolean; assignment: unknown },
      {
        challenge_id: string;
        title: string;
        due_date: string;
        assign_all: boolean;
        user_id?: string | null;
        org_id?: string | null;
      }
    >({
      query: (body) => ({
        url: '/gamification/assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Gamification'],
    }),
    deleteGamificationTrainingAssignment: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/gamification/assignments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gamification'],
    }),
    getGamificationAchievementsMe: builder.query({
      query: () => '/gamification/achievements/me',
      providesTags: ['Gamification'],
    }),
    getGamificationLeaderboard: builder.query({
      query: (arg?: { org_id?: string; dept_id?: string; limit?: number; scope?: string }) => {
        const params = new URLSearchParams();
        if (arg?.org_id) params.set('org_id', arg.org_id);
        if (arg?.dept_id) params.set('dept_id', arg.dept_id);
        if (arg?.limit != null) params.set('limit', String(arg.limit));
        if (arg?.scope) params.set('scope', arg.scope);
        const qs = params.toString();
        return `/gamification/leaderboard${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Gamification'],
    }),
    createLeaderboardSnapshot: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: '/gamification/leaderboard/snapshot',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Gamification'],
    }),
    getLeaderboardSnapshots: builder.query({
      query: (arg?: { limit?: number; scope?: string; org_id?: string; dept_id?: string }) => {
        const params = new URLSearchParams();
        if (arg?.limit != null) params.set('limit', String(arg.limit));
        if (arg?.scope) params.set('scope', arg.scope);
        if (arg?.org_id) params.set('org_id', arg.org_id);
        if (arg?.dept_id) params.set('dept_id', arg.dept_id);
        const qs = params.toString();
        return `/gamification/leaderboard/snapshots${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Gamification'],
    }),
    createGamificationChallenge: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: '/gamification/challenges',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Challenge'],
    }),
    updateGamificationChallenge: builder.mutation({
      query: ({ id, ...body }: { id: string } & Record<string, unknown>) => ({
        url: `/gamification/challenges/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Challenge'],
    }),
    deleteGamificationChallenge: builder.mutation({
      query: (id: string) => ({
        url: `/gamification/challenges/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Challenge'],
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation,
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetUnitTreeQuery,
  useCreateUnitMutation,
  useGetUnitTypesQuery,
  useCreateUnitTypeMutation,
  useGetAvailablePermissionsQuery,
  useAllocatePermissionMutation,
  useBulkAllocatePermissionsMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useGetUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserScopeMutation,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetPendingApplicantsQuery,
  useApproveApplicantMutation,
  useRejectApplicantMutation,
  useGetGamificationChallengesQuery,
  useGetGamificationChallengeByIdQuery,
  useCompleteGamificationChallengeMutation,
  useGetGamificationProgressMeQuery,
  useGetGamificationMyAssignmentsQuery,
  useGetGamificationTrainingAssignmentsAdminQuery,
  useCreateGamificationTrainingAssignmentMutation,
  useDeleteGamificationTrainingAssignmentMutation,
  useGetGamificationAchievementsMeQuery,
  useGetGamificationLeaderboardQuery,
  useCreateGamificationChallengeMutation,
  useUpdateGamificationChallengeMutation,
  useDeleteGamificationChallengeMutation,
  useCreateLeaderboardSnapshotMutation,
  useGetLeaderboardSnapshotsQuery,
} = practikalApi;


