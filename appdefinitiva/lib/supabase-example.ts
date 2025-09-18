import { supabase, isMobilePlatform, isWebPlatform, getPlatformInfo } from './supabase';

// Exemplo de uso do Supabase com detecção de plataforma
export class SupabaseService {
  // Exemplo de login
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        throw error;
      }

      console.log('Login bem-sucedido:', data.user?.email);
      return data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Exemplo de registro
  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Erro no registro:', error.message);
        throw error;
      }

      console.log('Registro bem-sucedido:', data.user?.email);
      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  // Exemplo de logout
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error.message);
        throw error;
      }

      console.log('Logout bem-sucedido');
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  // Exemplo de verificação de sessão atual
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao obter sessão:', error.message);
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      throw error;
    }
  }

  // Exemplo de listener para mudanças de autenticação
  static setupAuthListener(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento de autenticação:', event);
      console.log('Sessão:', session);
      callback(event, session);
    });
  }

  // Exemplo de operação com dados (substitua 'sua_tabela' pela tabela real)
  static async fetchData() {
    try {
      const { data, error } = await supabase
        .from('sua_tabela')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Erro ao buscar dados:', error.message);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      throw error;
    }
  }

  // Exemplo de inserção de dados
  static async insertData(data: any) {
    try {
      const { data: result, error } = await supabase
        .from('sua_tabela')
        .insert(data)
        .select();

      if (error) {
        console.error('Erro ao inserir dados:', error.message);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Erro ao inserir dados:', error);
      throw error;
    }
  }
}

// Exemplo de uso em um componente React
export const useSupabaseExample = () => {
  const handleLogin = async (email: string, password: string) => {
    try {
      // Verifica a plataforma antes de executar
      const platformInfo = getPlatformInfo();
      console.log('Executando em:', platformInfo.platform);

      if (isMobilePlatform()) {
        console.log('Usando AsyncStorage para armazenamento');
      } else if (isWebPlatform()) {
        console.log('Usando localStorage para armazenamento');
      }

      const result = await SupabaseService.signIn(email, password);
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await SupabaseService.signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  return {
    handleLogin,
    handleLogout,
    isMobile: isMobilePlatform(),
    isWeb: isWebPlatform(),
    platformInfo: getPlatformInfo(),
  };
};

// Exemplo de configuração de listener global
export const setupGlobalAuthListener = () => {
  return SupabaseService.setupAuthListener((event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        console.log('Usuário logado:', session?.user?.email);
        break;
      case 'SIGNED_OUT':
        console.log('Usuário deslogado');
        break;
      case 'TOKEN_REFRESHED':
        console.log('Token atualizado');
        break;
      default:
        console.log('Evento de autenticação:', event);
    }
  });
};

