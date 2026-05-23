import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: {
      id: string;
      email: string;
      username: string;
      roleCode: string;
      permissions: string[];
    };
    isTempToken?: boolean;
  }
}

export {};
