/**
 * Q-Learn Nexus - Production API Client Bridge
 * Typesafe HTTP client communicating with server-side /api/v1 REST endpoints with auth token persistence.
 * @license Apache-2.0
 */

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nexus_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nexus_auth_token', token);
    } else {
      localStorage.removeItem('nexus_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {
        errData = { message: response.statusText };
      }
      throw new Error(errData.message || `Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // --- Auth Endpoints ---
  public async register(payload: any) {
    const res = await this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public async login(payload: any) {
    const res = await this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  public async recoverPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/auth/recover-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(payload: { email: string; code: string; newPassword: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async deleteAccount() {
    const res = await this.request<{ success: boolean; message: string }>('/auth/account', {
      method: 'DELETE',
    });
    this.setToken(null);
    return res;
  }

  // --- Profile Endpoints ---
  public async getProfile() {
    return this.request<{ user: any; profile: any }>('/profile');
  }

  public async updateProfile(updates: any) {
    return this.request<{ success: boolean; user: any; profile: any }>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async uploadAvatar(dataUrl: string) {
    return this.request<{ success: boolean; avatarUrl: string }>('/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    });
  }

  // --- Project Endpoints ---
  public async getProjects() {
    return this.request<{ success: boolean; projects: any[] }>('/projects');
  }

  public async getProjectById(id: string) {
    return this.request<{ success: boolean; project: any }>(`/projects/${id}`);
  }

  public async createProject(payload: any) {
    return this.request<{ success: boolean; project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async shareProject(id: string, isPublic = true) {
    return this.request<{ success: boolean; shareUrl: string; isPublic: boolean; message: string }>(`/projects/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ isPublic }),
    });
  }

  public async updateProject(id: string, payload: any) {
    return this.request<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProject(id: string) {
    return this.request<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Simulation Endpoints ---
  public async runSimulationSync(circuitIR: any, shots = 1024) {
    return this.request<{ success: boolean; results: any }>('/simulations/sync', {
      method: 'POST',
      body: JSON.stringify({ circuitIR, shots }),
    });
  }

  public async queueSimulationJob(circuitIR: any, provider = 'NEXUS_SIM', shots = 1024) {
    return this.request<{ success: boolean; jobId: string; status: string; message: string }>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ circuitIR, provider, shots }),
    });
  }

  public async getSimulationJob(jobId: string) {
    return this.request<any>(`/simulations/${jobId}`);
  }

  public async cancelSimulationJob(jobId: string) {
    return this.request<{ success: boolean; message: string }>(`/simulations/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  public async transpileCircuit(circuitIR: any, target: 'qiskit' | 'pennylane' | 'cirq' | 'openqasm') {
    return this.request<{ success: boolean; target: string; code: string }>('/simulations/transpile', {
      method: 'POST',
      body: JSON.stringify({ circuitIR, target }),
    });
  }

  // --- Code Sandbox Runner ---
  public async executeSandboxCode(code: string, framework = 'qiskit') {
    return this.request<{ success: boolean; output: string; durationMs: number; memoryMb: number }>('/sandbox/run', {
      method: 'POST',
      body: JSON.stringify({ code, framework }),
    });
  }

  // --- AI Q-Nova Tutor Endpoints ---
  public async askAITutor(query: string, context?: any) {
    return this.request<{ success: boolean; response: string; model: string }>('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  }

  public async explainCircuitWithAI(circuitIR: any) {
    return this.request<{ success: boolean; explanation: string }>('/ai/explain-circuit', {
      method: 'POST',
      body: JSON.stringify({ circuitIR }),
    });
  }

  public async debugCodeWithAI(code: string, framework = 'qiskit') {
    return this.request<{ success: boolean; response: string }>('/ai/debug-code', {
      method: 'POST',
      body: JSON.stringify({ code, framework }),
    });
  }

  public async optimizeCircuitWithAI(circuitIR: any) {
    return this.request<{ success: boolean; suggestions: string }>('/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({ circuitIR }),
    });
  }

  // --- Courses & Progress ---
  public async getCourses() {
    return this.request<{ success: boolean; courses: any[] }>('/courses');
  }

  public async getLesson(courseId: string, lessonId: string) {
    return this.request<{ lesson: any }>(`/courses/${courseId}/lessons/${lessonId}`);
  }

  public async completeLesson(courseId: string, lessonId: string) {
    return this.request<{ success: boolean; xpEarned: number }>(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
    });
  }

  public async submitQuiz(quizId: string, selectedOptionIndex: number) {
    return this.request<{ success: boolean; isCorrect: boolean; correctOptionIndex: number; explanation: string }>(
      `/courses/quizzes/${quizId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ selectedOptionIndex }),
      }
    );
  }

  // --- Challenges ---
  public async getChallenges() {
    return this.request<{ success: boolean; challenges: any[] }>('/challenges');
  }

  public async submitChallenge(challengeId: string, code: string) {
    return this.request<{ success: boolean; passed: boolean; output: string; xpAwarded: number }>(
      `/challenges/${challengeId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  // --- Notifications ---
  public async getNotifications() {
    return this.request<{ success: boolean; notifications: any[]; unreadCount: number }>('/notifications');
  }

  public async markNotificationRead(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public async markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  public async deleteNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Analytics ---
  public async logAnalyticsEvent(eventType: string, eventData: any = {}) {
    try {
      return await this.request<{ success: boolean }>('/analytics/event', {
        method: 'POST',
        body: JSON.stringify({ eventType, eventData }),
      });
    } catch {
      // Non-blocking telemetry
      return { success: false };
    }
  }

  public async getAnalyticsSummary() {
    return this.request<{ platformStats: any; userStats: any }>('/analytics/summary');
  }

  // --- Admin ---
  public async getAdminUsers() {
    return this.request<{ success: boolean; users: any[] }>('/admin/users');
  }

  public async updateAdminUserRole(userId: string, role: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public async updateAdminUserStatus(userId: string, isActive: boolean) {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  public async getAdminAuditLogs(limit = 100) {
    return this.request<{ success: boolean; logs: any[] }>(`/admin/audit-logs?limit=${limit}`);
  }

  public async getAdminSecurityEvents(limit = 100) {
    return this.request<{ success: boolean; events: any[] }>(`/admin/security-events?limit=${limit}`);
  }

  public async getAdminSystemStats() {
    return this.request<{ success: boolean; server: any }>('/admin/system-stats');
  }
}

export const api = new ApiClient();
