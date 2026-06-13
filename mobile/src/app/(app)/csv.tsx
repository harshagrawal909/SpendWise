import { useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { SpendWiseTheme } from '@/constants/theme';
import API from '@/services/api';

function parseFilterDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export default function CsvExportScreen() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

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
          sort: 'asc', // chronological order
        },
      });

      const transactions = Array.isArray(res.data) ? res.data : [];

      if (transactions.length === 0) {
        Alert.alert('No Data', 'No transactions found for the selected date range.');
        setLoading(false);
        return;
      }

      // Convert to CSV
      let csvContent = 'Date,Type,Amount,Currency,Converted Amount,Category,Description\n';
      
      transactions.forEach((t) => {
        const dateStr = t.date ? new Date(t.date).toLocaleDateString() : '';
        const type = t.type || 'EXPENSE';
        const amount = t.amount ?? 0;
        const currency = t.currency || 'INR';
        const converted = t.convertedAmount ?? amount;
        const category = (t.category || '').replace(/"/g, '""');
        const desc = (t.description || '').replace(/"/g, '""');

        csvContent += `"${dateStr}","${type}",${amount},"${currency}",${converted},"${category}","${desc}"\n`;
      });

      // Write to local file system
      const filename = `SpendWise-Transactions-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
      if (!FileSystem.documentDirectory) {
        Alert.alert('Error', 'Local document directory is not available.');
        setLoading(false);
        return;
      }
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share via native share sheet
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not available on this device.');
      }
    } catch (e: unknown) {
      console.error('Error in csv.tsx handleExport:', e);
      const err = e as { response?: { data?: { message?: string } } };
      Alert.alert('Export Failed', err?.response?.data?.message ?? 'Could not export transaction data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>📊 Export Transactions</CardTitle>
          <CardSubtitle>Download your financial records as a CSV spreadsheet file.</CardSubtitle>
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

          <Text style={styles.sectionLabel}>Custom Date Range</Text>
          <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
          <DatePickerField
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minimumDate={startDate ? parseFilterDate(startDate) : undefined}
          />

          <Button
            title={loading ? 'Preparing Export...' : '📥 Export Data (CSV)'}
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
