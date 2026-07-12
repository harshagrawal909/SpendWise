import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '@/services/api';
import { formatCurrency } from '@/utils/currency';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SpendWiseTheme } from '@/constants/theme';

type Account = {
  _id: string;
  name: string;
  balance: number;
  color: string;
  isDefault: boolean;
};

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#EF4444', // Rose
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4'  // Cyan
];

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userCurrency, setUserCurrency] = useState('INR');

  // Form State
  const [isEditing, setIsEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, userRes] = await Promise.all([
        API.get('/accounts'),
        API.get('/users/me').catch(() => ({ data: { currency: 'INR' } })),
      ]);
      setAccounts(accountsRes.data || []);
      setUserCurrency(userRes.data?.currency || 'INR');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [fetchAccounts])
  );

  const resetForm = () => {
    setName('');
    setBalance('');
    setColor('#4F46E5');
    setIsDefault(false);
    setIsEditing(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Account name is required.');
      return;
    }

    setActionLoading(true);
    try {
      if (isEditing) {
        // Edit account
        await API.put(`/accounts/${isEditing._id}`, {
          name: name.trim(),
          balance: Number(balance) || 0,
          color,
          isDefault,
        });
        Alert.alert('Success', 'Account updated successfully.');
      } else {
        // Create account
        if (accounts.length >= 3) {
          Alert.alert('Limit Reached', 'You can have a maximum of 3 accounts.');
          setActionLoading(false);
          return;
        }
        await API.post('/accounts', {
          name: name.trim(),
          balance: Number(balance) || 0,
          color,
          isDefault,
        });
        Alert.alert('Success', 'Account created successfully.');
      }
      resetForm();
      await fetchAccounts();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPress = (acc: Account) => {
    setIsEditing(acc);
    setName(acc.name);
    setBalance(String(acc.balance || 0));
    setColor(acc.color || '#4F46E5');
    setIsDefault(acc.isDefault);
  };

  const handleDelete = (id: string, accName: string) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${accName}"?\nAll transactions linked to this account will be automatically moved to your default account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await API.delete(`/accounts/${id}`);
              Alert.alert('Success', 'Account deleted successfully.');
              if (isEditing?._id === id) {
                resetForm();
              }
              await fetchAccounts();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Could not delete account.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (acc: Account) => {
    setActionLoading(true);
    try {
      await API.put(`/accounts/${acc._id}`, { ...acc, isDefault: true });
      Alert.alert('Success', `"${acc.name}" is now set as default.`);
      await fetchAccounts();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to set default.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={SpendWiseTheme.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>Manage your transaction wallets</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SpendWiseTheme.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* List Accounts */}
          <View style={styles.listContainer}>
            {accounts.map((acc) => (
              <View key={acc._id} style={styles.accountCard}>
                {/* Accent Color Band */}
                <View style={[styles.colorAccent, { backgroundColor: acc.color }]} />
                <View style={styles.accountDetails}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.nameRow}>
                      <Text style={styles.accountName}>{acc.name}</Text>
                      {acc.isDefault ? (
                        <Badge label="Default" variant="success" />
                      ) : (
                        <TouchableOpacity
                          disabled={actionLoading}
                          onPress={() => handleSetDefault(acc)}
                        >
                          <Text style={styles.makeDefaultText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleEditPress(acc)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={20} color={SpendWiseTheme.muted} />
                      </TouchableOpacity>
                      {!acc.isDefault && (
                        <TouchableOpacity onPress={() => handleDelete(acc._id, acc.name)} style={styles.iconBtn}>
                          <Ionicons name="trash-outline" size={20} color={SpendWiseTheme.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(acc.balance || 0, userCurrency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Create/Edit Section */}
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Account' : 'New Account'}</CardTitle>
              <CardSubtitle>
                {isEditing ? `Modify settings for "${isEditing.name}"` : 'Add up to 3 transaction accounts'}
              </CardSubtitle>
            </CardHeader>
            <CardBody>
              {accounts.length >= 3 && !isEditing ? (
                <Text style={styles.limitText}>
                  Limit reached. Delete or edit an existing account to make changes.
                </Text>
              ) : (
                <View style={styles.form}>
                  <Input
                    label="Account Name"
                    placeholder="e.g. Cash, HDFC, Credit Card"
                    value={name}
                    onChangeText={setName}
                  />

                  <Input
                    label={`Initial Balance (${userCurrency})`}
                    placeholder="e.g. 5000"
                    keyboardType="numeric"
                    value={balance}
                    onChangeText={setBalance}
                  />

                  <View style={styles.colorPickerContainer}>
                    <Text style={styles.colorLabel}>Select Color</Text>
                    <View style={styles.colorRow}>
                      {PRESET_COLORS.map((c) => {
                        const isSelected = color === c;
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => setColor(c)}
                            style={[
                              styles.colorCircle,
                              { backgroundColor: c },
                              isSelected && styles.selectedCircle,
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity
                    disabled={isEditing?.isDefault}
                    onPress={() => setIsDefault(!isDefault)}
                    style={styles.checkboxRow}
                  >
                    <Ionicons
                      name={isDefault ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isDefault ? SpendWiseTheme.primary : SpendWiseTheme.muted}
                    />
                    <Text style={styles.checkboxLabel}>Set as Default Account</Text>
                  </TouchableOpacity>

                  <View style={styles.buttonRow}>
                    <Button
                      title={isEditing ? 'Save Changes' : 'Create Account'}
                      onPress={handleSave}
                      loading={actionLoading}
                      style={{ flex: 1 }}
                    />
                    {isEditing && (
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={resetForm}
                        disabled={actionLoading}
                        style={{ marginLeft: 10 }}
                      />
                    )}
                  </View>
                </View>
              )}
            </CardBody>
          </Card>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  subtitle: {
    fontSize: 12,
    color: SpendWiseTheme.muted,
    fontWeight: '500',
  },
  listContainer: {
    gap: 12,
    marginBottom: 20,
  },
  accountCard: {
    borderRadius: SpendWiseTheme.radius,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  colorAccent: {
    width: 8,
    height: '100%',
  },
  accountDetails: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  makeDefaultText: {
    fontSize: 11,
    color: SpendWiseTheme.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  accountBalance: {
    fontSize: 22,
    fontWeight: '900',
    color: SpendWiseTheme.text,
    marginTop: 8,
  },
  formCard: {
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  colorPickerContainer: {
    marginTop: 4,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    borderColor: SpendWiseTheme.text,
    transform: [{ scale: 1.1 }],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SpendWiseTheme.text,
  },
  limitText: {
    fontSize: 13,
    color: SpendWiseTheme.muted,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
