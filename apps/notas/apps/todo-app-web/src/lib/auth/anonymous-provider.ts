import type { AnonymousAuthProvider } from './types';
import type { AnonymousActor } from '@/types';

const AUTH_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Anonymous auth provider
 *
 * Creates and manages anonymous sessions for users who haven't logged in.
 * Anonymous users can create todos but data is not permanent.
 */
export class AnonymousAuthImplementation implements AnonymousAuthProvider {
  readonly type = 'anonymous' as const;

  private currentSession: { token: string; actor: AnonymousActor } | null = null;

  async createSession(): Promise<{ token: string; actor: AnonymousActor }> {
    const deviceId = this.generateDeviceId();
    const response = await fetch(`${AUTH_BASE}/auth/token/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: deviceId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create anonymous session');
    }

    const data = await response.json();

    this.currentSession = {
      token: data.token,
      actor: {
        actor_type: 'anonymous',
        actor_id: deviceId,
        session_id: deviceId,
        channel: 'web',
      },
    };

    return this.currentSession;
  }

  async refreshSession(): Promise<{ token: string; actor: AnonymousActor }> {
    if (!this.currentSession) {
      return this.createSession();
    }

    // For anonymous sessions, we create a new one with the same device ID
    return this.createSession();
  }

  /**
   * Generate a persistent device ID for anonymous users
   * In production, use proper device fingerprinting
   */
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('todo_device_id');

    if (!deviceId) {
      deviceId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('todo_device_id', deviceId);
    }

    return deviceId;
  }

  getCurrentSession(): { token: string; actor: AnonymousActor } | null {
    return this.currentSession;
  }

  setCurrentSession(session: { token: string; actor: AnonymousActor } | null): void {
    this.currentSession = session;
  }
}
