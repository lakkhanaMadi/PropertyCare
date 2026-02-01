/// <reference types="@clerk/express/env" />

export type Roles = 'admin' | 'homeowner' | 'worker'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}