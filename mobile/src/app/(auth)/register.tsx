import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContext, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const schema = yup.object().shape({
  business_name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), undefined], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function RegisterScreen() {
  const { login } = useContext(AuthContext);
  const [role, setRole] = useState('consumer');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { business_name: '', email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const generatedUsername = data.email.trim().split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 10000);
      
      if (role === 'donor' || role === 'shelter') {
        // Defer registration to the profile setup screen
        const params = {
          email: data.email.trim(),
          password: data.password,
          business_name: data.business_name,
          username: generatedUsername,
          role: role
        };
        
        if (role === 'donor') {
          router.replace({ pathname: '/(forms)/edit-kitchen-profile/new', params });
        } else {
          router.replace({ pathname: '/(forms)/edit-shelter-profile/new', params });
        }
      } else {
        // Consumers can register immediately (no profile setup required)
        await api.post('/users/register/', {
          username: generatedUsername,
          business_name: data.business_name,
          email: data.email.trim(),
          password: data.password,
          role: role
        });
        
        const loginRes = await api.post('/users/login/', {
          email: data.email.trim(),
          password: data.password,
        });
        await login(loginRes.data.access, loginRes.data.refresh);
        router.replace('/');
      }
    } catch (err: any) {
      if (err.response?.data?.email) {
        setErrorMsg('Email is already in use. Please log in.');
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      
      <View style={styles.roleContainer}>
        <TouchableOpacity style={[styles.roleBtn, role === 'consumer' && styles.roleActive]} onPress={() => setRole('consumer')}>
          <Text style={[styles.roleText, role === 'consumer' && styles.roleTextActive]}>Consumer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleBtn, role === 'donor' && styles.roleActive]} onPress={() => setRole('donor')}>
          <Text style={[styles.roleText, role === 'donor' && styles.roleTextActive]}>Kitchen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleBtn, role === 'shelter' && styles.roleActive]} onPress={() => setRole('shelter')}>
          <Text style={[styles.roleText, role === 'shelter' && styles.roleTextActive]}>Shelter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          name="business_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput style={[styles.input, errors.business_name && styles.inputError]} placeholder="Full Name or Org Name" onBlur={onBlur} onChangeText={onChange} value={value} />
              {errors.business_name && <Text style={styles.validationError}>{errors.business_name.message}</Text>}
            </>
          )}
        />
        
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email Address" onBlur={onBlur} onChangeText={onChange} value={value} autoCapitalize="none" />
              {errors.email && <Text style={styles.validationError}>{errors.email.message}</Text>}
            </>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput style={styles.passwordInput} placeholder="Password" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.validationError}>{errors.password.message}</Text>}
            </>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput style={styles.passwordInput} placeholder="Confirm Password" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry={!showConfirmPassword} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.validationError}>{errors.confirmPassword.message}</Text>}
            </>
          )}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  errorText: { color: '#ef4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  validationError: { color: '#ef4444', fontSize: 12, marginBottom: 8, marginTop: -12, marginLeft: 4 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#e2e8f0', padding: 4, borderRadius: 12 },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  roleActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  roleText: { color: '#64748b', fontWeight: '600' },
  roleTextActive: { color: '#0f172a' },
  inputContainer: { marginBottom: 24 },
  input: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  inputError: { borderColor: '#ef4444' },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { alignItems: 'center' },
  linkText: { color: '#64748b', fontSize: 14, fontWeight: '600' }
});