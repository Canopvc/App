# Configuração do Supabase para React Native com Expo

Este projeto inclui uma configuração do Supabase otimizada para React Native com Expo que funciona em todas as plataformas (Android, iOS e Web) sem erros de "window is not defined".

## Características

- ✅ **Detecção automática de plataforma**: Usa AsyncStorage em dispositivos móveis e localStorage no web
- ✅ **Compatível com TypeScript**: Totalmente tipado
- ✅ **Funciona no Expo Go**: Testado no emulador Android
- ✅ **Evita erro "window is not defined"**: Configuração condicional baseada na plataforma
- ✅ **Helpers úteis**: Funções para detectar plataforma e obter informações

## Arquivos

- `supabase.ts` - Configuração principal do cliente Supabase
- `supabase-example.ts` - Exemplos de uso e helpers
- `README-Supabase.md` - Este arquivo de documentação

## Configuração

### 1. Instalação das dependências

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. Configuração do cliente

O arquivo `lib/supabase.ts` já está configurado com:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseConfig = {
  auth: {
    // Usa AsyncStorage apenas em dispositivos móveis (Android/iOS)
    // No web, não especifica storage para usar localStorage padrão
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
```

## Uso Básico

### Importar o cliente

```typescript
import { supabase } from '../lib/supabase';
```

### Autenticação

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Logout
const { error } = await supabase.auth.signOut();
```

### Verificar sessão atual

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('Usuário logado:', session.user.email);
}
```

## Helpers Disponíveis

### Detecção de Plataforma

```typescript
import { isMobilePlatform, isWebPlatform, getPlatformInfo } from '../lib/supabase';

// Verificar se está em dispositivo móvel
if (isMobilePlatform()) {
  console.log('Executando em dispositivo móvel');
}

// Verificar se está no web
if (isWebPlatform()) {
  console.log('Executando no web');
}

// Obter informações completas da plataforma
const platformInfo = getPlatformInfo();
console.log(platformInfo);
// Output: { platform: 'android', isMobile: true, isWeb: false, version: 30 }
```

### Exemplo de Hook Personalizado

```typescript
import { useSupabaseExample } from '../lib/supabase-example';

const MyComponent = () => {
  const { handleLogin, handleLogout, isMobile, platformInfo } = useSupabaseExample();

  const onLogin = async () => {
    try {
      await handleLogin('user@example.com', 'password123');
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  return (
    <View>
      <Text>Plataforma: {platformInfo.platform}</Text>
      <Button title="Login" onPress={onLogin} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};
```

## Operações com Dados

### Buscar dados

```typescript
const { data, error } = await supabase
  .from('sua_tabela')
  .select('*')
  .limit(10);

if (error) {
  console.error('Erro:', error.message);
} else {
  console.log('Dados:', data);
}
```

### Inserir dados

```typescript
const { data, error } = await supabase
  .from('sua_tabela')
  .insert([
    { nome: 'João', email: 'joao@example.com' }
  ])
  .select();

if (error) {
  console.error('Erro:', error.message);
} else {
  console.log('Dados inseridos:', data);
}
```

## Listener de Autenticação

### Configurar listener global

```typescript
import { setupGlobalAuthListener } from '../lib/supabase-example';

// No seu App.tsx ou arquivo principal
useEffect(() => {
  const { data: { subscription } } = setupGlobalAuthListener();
  
  return () => subscription.unsubscribe();
}, []);
```

### Listener personalizado

```typescript
import { supabase } from '../lib/supabase';

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
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
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## Variáveis de Ambiente

Para maior segurança, recomenda-se usar variáveis de ambiente:

### 1. Criar arquivo `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://qocrpcfrhkoritoomgzx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Atualizar `supabase.ts`

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

## Troubleshooting

### Erro "window is not defined"

Se você ainda encontrar este erro, verifique se:

1. O arquivo `supabase.ts` está usando a configuração condicional correta
2. Não há imports desnecessários de AsyncStorage no web
3. O `Platform.OS` está sendo usado corretamente

### Erro de AsyncStorage no web

Se você encontrar erros relacionados ao AsyncStorage no web:

1. Verifique se a condição `Platform.OS !== 'web'` está funcionando
2. Certifique-se de que o AsyncStorage só é usado em dispositivos móveis

### Problemas de autenticação

1. Verifique se as credenciais do Supabase estão corretas
2. Confirme se o projeto Supabase está configurado corretamente
3. Verifique se as políticas de segurança (RLS) estão configuradas

## Testando

### Android (Expo Go)

```bash
npx expo start
# Escaneie o QR code com o Expo Go
```

### Web

```bash
npx expo start --web
```

### iOS

```bash
npx expo start
# Escaneie o QR code com o Expo Go ou use simulador
```

## Estrutura de Arquivos Recomendada

```
lib/
├── supabase.ts              # Configuração principal
├── supabase-example.ts      # Exemplos e helpers
├── supabase-types.ts        # Tipos TypeScript (opcional)
└── README-Supabase.md       # Documentação
```

## Recursos Adicionais

- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Guia do React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)

