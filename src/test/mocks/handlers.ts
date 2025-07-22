import { http, HttpResponse } from 'msw'

export const handlers = [
  // Firebase Auth endpoints
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
    return HttpResponse.json({
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: 'test-user-id',
      email: 'test@example.com',
      displayName: '',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600'
    })
  }),

  http.post('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', () => {
    return HttpResponse.json({
      kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
      email: 'test@example.com'
    })
  }),

  // Firebase Firestore endpoints
  http.post('*/v1/projects/*/databases/(default)/documents:commit', () => {
    return HttpResponse.json({
      writeResults: [
        {
          updateTime: '2022-01-01T00:00:00.000000Z'
        }
      ]
    })
  }),

  http.get('*/v1/projects/*/databases/(default)/documents/*', () => {
    return HttpResponse.json({
      name: 'projects/test-project/databases/(default)/documents/test-collection/test-doc',
      fields: {
        id: { stringValue: 'test-id' },
        name: { stringValue: 'Test Document' },
        createdAt: { timestampValue: '2022-01-01T00:00:00.000000Z' }
      },
      createTime: '2022-01-01T00:00:00.000000Z',
      updateTime: '2022-01-01T00:00:00.000000Z'
    })
  }),

  // Supabase endpoints (for legacy support during migration)
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    })
  }),

  http.get('*/rest/v1/*', () => {
    return HttpResponse.json([])
  }),

  http.post('*/rest/v1/*', () => {
    return HttpResponse.json({
      id: 'test-id',
      created_at: '2022-01-01T00:00:00.000000Z'
    })
  }),

  // Handle any unhandled requests
  http.all('*', (req) => {
    console.warn(`Unhandled ${req.request.method} request to ${req.request.url}`)
    return new HttpResponse(null, { status: 404 })
  })
]