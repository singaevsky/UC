// file: tests/__mocks__/supabase.js

// ✅ Мок Supabase клиента
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(() =>
      Promise.resolve({
        data: { user: null },
        error: null
      })
    ),
    signInWithPassword: jest.fn(() =>
      Promise.resolve({
        data: { user: null, session: null },
        error: null
      })
    ),
    signOut: jest.fn(() =>
      Promise.resolve({
        error: null
      })
    ),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    })),
    signUp: jest.fn(() =>
      Promise.resolve({
        data: { user: null, session: null },
        error: null
      })
    ),
    resetPasswordForEmail: jest.fn(() =>
      Promise.resolve({
        data: {},
        error: null
      })
    ),
    updateUser: jest.fn(() =>
      Promise.resolve({
        data: { user: null },
        error: null
      })
    ),
  },

  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
        maybeSingle: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
        order: jest.fn(() => ({
          limit: jest.fn(() =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
        range: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
      neq: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
        order: jest.fn(() => ({
          limit: jest.fn(() =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() =>
            Promise.resolve({ data: [], error: null })
          ),
        })),
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
      limit: jest.fn(() =>
        Promise.resolve({ data: [], error: null })
      ),
      range: jest.fn(() =>
        Promise.resolve({ data: [], error: null })
      ),
    })),

    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
      })),
      single: jest.fn(() =>
        Promise.resolve({ data: null, error: null })
      ),
    })),

    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
      })),
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
      })),
    })),

    delete: jest.fn(() => ({
      eq: jest.fn(() =>
        Promise.resolve({ data: null, error: null })
      ),
    })),

    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: null, error: null })
        ),
      })),
      single: jest.fn(() =>
        Promise.resolve({ data: null, error: null })
      ),
    })),

    // ✅ Дополнительные методы
    rpc: jest.fn(() =>
      Promise.resolve({ data: null, error: null })
    ),

    // ✅ Мок для count
    count: jest.fn(() =>
      Promise.resolve({ count: 0, error: null })
    ),

    // ✅ Мок для filter
    filter: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
    })),

    // ✅ Мок для or
    or: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
    })),

    // ✅ Мок для not
    not: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
    })),
  })),

  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() =>
        Promise.resolve({
          data: {
            path: 'test/path',
            fullPath: 'test/full/path'
          },
          error: null
        })
      ),
      download: jest.fn(() =>
        Promise.resolve({
          data: new Blob(['test']),
          error: null
        })
      ),
      remove: jest.fn(() =>
        Promise.resolve({
          data: [],
          error: null
        })
      ),
      list: jest.fn(() =>
        Promise.resolve({
          data: [],
          error: null
        })
      ),
      getPublicUrl: jest.fn(() => ({
        data: {
          publicUrl: 'https://test.supabase.co/storage/v1/object/public/test'
        }
      })),
    })),
  },

  // ✅ Мок для realtime
  realtime: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          data: { status: 'SUBSCRIBED' }
        })),
      })),
      unsubscribe: jest.fn(() =>
        Promise.resolve({ status: 'CLOSED' })
      ),
    })),
  },

  // ✅ Мок для functions
  functions: {
    invoke: jest.fn(() =>
      Promise.resolve({
        data: null,
        error: null
      })
    ),
  },

  // ✅ Мок для admin (если используется)
  admin: {
    auth: {
      getUserById: jest.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      adminListUsers: jest.fn(() =>
        Promise.resolve({ data: { users: [] }, error: null })
      ),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() =>
          Promise.resolve({ data: [], error: null })
        ),
      })),
    })),
  },
};

// ✅ Функция создания мок клиента
const createClient = jest.fn(() => mockSupabaseClient);

// ✅ Экспорт
module.exports = {
  createClient,
  mockSupabaseClient,
};
