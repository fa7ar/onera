import type { Container } from '@/infrastructure/container';
import type { AuthSession } from '@/domain/types';
import { AuthenticationError, ValidationError } from '@/domain/errors';
import { validateEmail } from '@/domain/policies';
import { EventTypes, createEvent } from '@/domain/events';

export class AuthUseCases {
  constructor(private readonly c: Container) {}

  async signUp(email: string, password: string, fullName: string) {
    if (!validateEmail(email)) throw new ValidationError('Invalid email address');
    if (password.length < 6) throw new ValidationError('Password must be at least 6 characters');
    if (!fullName.trim()) throw new ValidationError('Name is required');

    const { user, error } = await this.c.auth.signUp(email, password, fullName);
    if (error) throw new AuthenticationError(error);
    if (!user) throw new AuthenticationError('Sign up failed');

    this.c.eventBus.publish(
      createEvent(EventTypes.USER_SIGNED_UP, { userId: user.id, email }),
    );
    return user;
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    if (!validateEmail(email)) throw new ValidationError('Invalid email address');
    if (!password) throw new ValidationError('Password is required');

    const { session, error } = await this.c.auth.signIn(email, password);
    if (error) throw new AuthenticationError(error);
    if (!session) throw new AuthenticationError('Sign in failed');

    this.c.eventBus.publish(
      createEvent(EventTypes.USER_SIGNED_IN, { userId: session.user.id }),
    );
    return session;
  }

  async signOut(): Promise<void> {
    await this.c.auth.signOut();
  }

  async getSession(): Promise<AuthSession | null> {
    return this.c.auth.getSession();
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    return this.c.auth.onAuthStateChange(callback);
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 6)
      throw new ValidationError('Password must be at least 6 characters');
    const { error } = await this.c.auth.updatePassword(newPassword);
    if (error) throw new AuthenticationError(error);
  }
}
