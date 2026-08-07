import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useContext, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', data);
      await login(response.data.access, response.data.refresh);
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Hyper-Local Food Excess Exchange</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput 
                style={[styles.input, errors.email && styles.inputError]} 
                placeholder="Email Address" 
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.validationError}>{errors.email.message}</Text>}
            </>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput 
                style={[styles.input, errors.password && styles.inputError]} 
                placeholder="Password" 
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
              {errors.password && <Text style={styles.validationError}>{errors.password.message}</Text>}
            </>
          )}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  errorText: { color: '#ef4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  validationError: { color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -12, marginLeft: 4 },
  inputContainer: { marginBottom: 24 },
  input: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  inputError: { borderColor: '#ef4444' },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { alignItems: 'center' },
  linkText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' }
});