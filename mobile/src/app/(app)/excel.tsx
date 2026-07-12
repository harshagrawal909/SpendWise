import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, Platform, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { SpendWiseTheme } from '@/constants/theme';
import API from '@/services/api';

function parseFilterDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export default function ExcelExportScreen() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    API.get('/accounts')
      .then((res) => setAccounts(res.data || []))
      .catch((err) => console.error("Error loading accounts in Excel:", err));
  }, []);

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const formatDateInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/expenses/filter', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sort: 'asc',
          accountId: selectedAccountId || undefined,
        },
      });

      const transactions = Array.isArray(res.data) ? res.data : [];

      if (transactions.length === 0) {
        Alert.alert('No Data', 'No transactions found for the selected filters.');
        setLoading(false);
        return;
      }

      // Convert to Excel workbook using SheetJS
      const dataRows = transactions.map((t) => ({
        Date: t.date ? new Date(t.date).toLocaleDateString() : '',
        Type: t.type || 'EXPENSE',
        Amount: t.amount ?? 0,
        Currency: t.currency || 'INR',
        'Converted Amount': t.convertedAmount ?? (t.amount ?? 0),
        Account: t.account?.name || 'Primary',
        Category: t.category || '',
        Description: t.description || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      
      // Auto-fit columns
      const maxLens: Record<string, number> = {};
      dataRows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const val = String((row as any)[key] ?? '');
          maxLens[key] = Math.max(maxLens[key] || 10, val.length + 2);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map((key) => ({ wch: maxLens[key] }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Write workbook in base64 format
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const filename = `SpendWise-Transactions-${startDate || 'all'}-to-${endDate || 'all'}.xlsx`;

      if (Platform.OS === 'android') {
        // Direct Download via StorageAccessFramework on Android
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const directoryUri = permissions.directoryUri;
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri,
              filename,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            await FileSystem.writeAsStringAsync(fileUri, wbout, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert('Download Successful', `Excel file saved successfully to your selected folder.`);
          } else {
            // Fallback to sharing if directory permission denied
            await fallbackShare(wbout, filename);
          }
        } catch (safErr) {
          console.warn('SAF failed, falling back to Sharing:', safErr);
          await fallbackShare(wbout, filename);
        }
      } else {
        // iOS: Native Sharing sheet (Save to Files)
        await fallbackShare(wbout, filename);
      }
    } catch (e: unknown) {
      console.error('Error in excel.tsx handleExport:', e);
      const err = e as { response?: { data?: { message?: string } } };
      Alert.alert('Export Failed', err?.response?.data?.message ?? 'Could not export transaction data.');
    } finally {
      setLoading(false);
    }
  };

  const fallbackShare = async (wboutBase64: string, filename: string) => {
    if (!FileSystem.documentDirectory) {
      Alert.alert('Error', 'Local directory not available.');
      return;
    }
    const fileUri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, wboutBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Transactions Excel',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    } else {
      Alert.alert('Sharing Unavailable', 'Native sharing is not available on this device.');
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>📊 Export Transactions</CardTitle>
          <CardSubtitle>Download your financial records as an Excel spreadsheet file.</CardSubtitle>
        </CardHeader>
        <CardBody style={{ gap: 16 }}>
          <View>
            <Text style={styles.sectionLabel}>Quick Range Select</Text>
            <View style={styles.quickSelectRow}>
              <Button title="Last 1 Week" variant="outline" style={{ minHeight: 36, paddingVertical: 6, borderRadius: 8, flex: 1 }} onPress={() => handleQuickSelect(7)} />
              <Button title="Last 1 Month" variant="outline" style={{ minHeight: 36, paddingVertical: 6, borderRadius: 8, flex: 1 }} onPress={() => handleQuickSelect(30)} />
              <Button title="Last 1 Year" variant="outline" style={{ minHeight: 36, paddingVertical: 6, borderRadius: 8, flex: 1 }} onPress={() => handleQuickSelect(365)} />
            </View>
            <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); }} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Reset Range</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Select
            label="Filter by Account"
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
            options={[{ label: 'All Accounts (Combined)', value: '' }, ...accounts.map((acc) => ({ label: acc.name, value: acc._id }))]}
          />

          <Text style={styles.sectionLabel}>Custom Date Range</Text>
          <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
          <DatePickerField
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minimumDate={startDate ? parseFilterDate(startDate) : undefined}
          />

          <Button
            title={loading ? 'Preparing Export...' : '📥 Export Data (Excel)'}
            onPress={handleExport}
            disabled={loading}
            style={{ marginTop: 8 }}
          />
        </CardBody>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: SpendWiseTheme.danger,
  },
  divider: {
    height: 1,
    backgroundColor: SpendWiseTheme.border,
    marginVertical: 4,
  },
});
