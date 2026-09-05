import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ThemeDateTimePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function ThemeDateTimePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
  minimumDate = new Date()
}: ThemeDateTimePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [viewYear, setViewYear] = useState<number>(value.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(value.getMonth());

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(value.getTime()));
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
      setActiveTab('date');
    }
  }, [visible, value]);

  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handleDaySelect = (day: number) => {
    Haptics.selectionAsync();
    const next = new Date(selectedDate.getTime());
    next.setFullYear(viewYear);
    next.setMonth(viewMonth);
    next.setDate(day);
    setSelectedDate(next);
  };

  const handleHourSelect = (hour12: number) => {
    Haptics.selectionAsync();
    const next = new Date(selectedDate.getTime());
    const currentHours = next.getHours();
    const isPM = currentHours >= 12;
    let newHours = hour12 % 12;
    if (isPM) newHours += 12;
    next.setHours(newHours);
    setSelectedDate(next);
  };

  const handleMinuteSelect = (min: number) => {
    Haptics.selectionAsync();
    const next = new Date(selectedDate.getTime());
    next.setMinutes(min);
    setSelectedDate(next);
  };

  const handleAmPmToggle = (targetIsPM: boolean) => {
    Haptics.selectionAsync();
    const next = new Date(selectedDate.getTime());
    let hours = next.getHours();
    const currentIsPM = hours >= 12;
    if (currentIsPM !== targetIsPM) {
      if (targetIsPM) {
        hours += 12;
      } else {
        hours -= 12;
      }
      next.setHours(hours);
      setSelectedDate(next);
    }
  };

  const handleApplyPreset = (hoursToAdd: number) => {
    Haptics.selectionAsync();
    const next = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
    setSelectedDate(next);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(selectedDate);
    onClose();
  };

  const currentHour24 = selectedDate.getHours();
  const isPM = currentHour24 >= 12;
  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12;
  const currentMinutes = selectedDate.getMinutes();

  const startOfMinDate = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const isSelectedDay = (d: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === d
    );
  };

  const isPastDay = (d: number) => {
    const checkDate = new Date(viewYear, viewMonth, d);
    return checkDate < startOfMinDate;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0F172A', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.topGlow} />

            {/* Header / Current selection display */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={18} color="#5EEAD4" />
                </View>
                <View>
                  <Text style={styles.headerSub}>PICKUP DEADLINE</Text>
                  <Text style={styles.headerValue}>
                    {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {selectedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'date' && styles.tabBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('date');
                }}
              >
                <Ionicons name="calendar" size={16} color={activeTab === 'date' ? '#5EEAD4' : '#64748B'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'date' && styles.tabTextActive]}>Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'time' && styles.tabBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('time');
                }}
              >
                <Ionicons name="time-outline" size={16} color={activeTab === 'time' ? '#5EEAD4' : '#64748B'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'time' && styles.tabTextActive]}>Time</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'date' ? (
              <View style={styles.tabContent}>
                {/* Month Selector */}
                <View style={styles.monthHeader}>
                  <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
                    <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                  <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
                    <Ionicons name="chevron-forward" size={20} color="#F8FAFC" />
                  </TouchableOpacity>
                </View>

                {/* Weekday labels */}
                <View style={styles.weekdaysRow}>
                  {WEEKDAY_NAMES.map(w => (
                    <Text key={w} style={styles.weekdayLabel}>{w}</Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {daysArray.map((day, idx) => {
                    if (day === null) {
                      return <View key={`empty-${idx}`} style={styles.dayCell} />;
                    }
                    const selected = isSelectedDay(day);
                    const disabled = isPastDay(day);

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        style={[
                          styles.dayCell,
                          selected && styles.dayCellSelected,
                          disabled && styles.dayCellDisabled
                        ]}
                        disabled={disabled}
                        onPress={() => handleDaySelect(day)}
                      >
                        <Text style={[
                          styles.dayText,
                          selected && styles.dayTextSelected,
                          disabled && styles.dayTextDisabled
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.tabContent}>
                {/* Quick Presets */}
                <Text style={styles.sectionHeading}>QUICK PRESETS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {[
                    { label: '+2 Hours', hours: 2 },
                    { label: '+4 Hours', hours: 4 },
                    { label: '+8 Hours', hours: 8 },
                    { label: '+24 Hours', hours: 24 }
                  ].map(p => (
                    <TouchableOpacity
                      key={p.label}
                      style={styles.presetChip}
                      onPress={() => handleApplyPreset(p.hours)}
                    >
                      <Ionicons name="flash-outline" size={12} color="#5EEAD4" style={{ marginRight: 4 }} />
                      <Text style={styles.presetChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* AM / PM Toggle */}
                <View style={styles.ampmRow}>
                  <Text style={styles.sectionHeading}>HOUR & PERIOD</Text>
                  <View style={styles.ampmSwitch}>
                    <TouchableOpacity
                      style={[styles.ampmBtn, !isPM && styles.ampmBtnActive]}
                      onPress={() => handleAmPmToggle(false)}
                    >
                      <Text style={[styles.ampmText, !isPM && styles.ampmTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ampmBtn, isPM && styles.ampmBtnActive]}
                      onPress={() => handleAmPmToggle(true)}
                    >
                      <Text style={[styles.ampmText, isPM && styles.ampmTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Hours row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePillsRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
                    const selected = currentHour12 === h;
                    return (
                      <TouchableOpacity
                        key={`h-${h}`}
                        style={[styles.timePill, selected && styles.timePillSelected]}
                        onPress={() => handleHourSelect(h)}
                      >
                        <Text style={[styles.timePillText, selected && styles.timePillTextSelected]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Minutes row */}
                <Text style={[styles.sectionHeading, { marginTop: 14 }]}>MINUTES</Text>
                <View style={styles.minutesGrid}>
                  {[0, 15, 30, 45].map(m => {
                    const selected = Math.abs(currentMinutes - m) < 8 || (m === 45 && currentMinutes >= 45);
                    const label = m < 10 ? `0${m}` : `${m}`;
                    return (
                      <TouchableOpacity
                        key={`m-${m}`}
                        style={[styles.minutePill, selected && styles.minutePillSelected]}
                        onPress={() => handleMinuteSelect(m)}
                      >
                        <Text style={[styles.minutePillText, selected && styles.minutePillTextSelected]}>
                          :{label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelActionBtn} onPress={onClose}>
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmActionBtn} onPress={handleConfirm}>
                <LinearGradient
                  colors={['#0F766E', '#042F2E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#5EEAD4" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmActionText}>Set Deadline</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: '#5EEAD4',
    opacity: 0.8,
    borderRadius: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)'
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5EEAD4',
    letterSpacing: 0.8
  },
  headerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  tabTextActive: {
    color: '#5EEAD4'
  },
  tabContent: {
    minHeight: 250
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  dayCell: {
    width: 38,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginVertical: 2
  },
  dayCellSelected: {
    backgroundColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4
  },
  dayCellDisabled: {
    opacity: 0.25
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  dayTextSelected: {
    color: '#042F2E',
    fontWeight: '800'
  },
  dayTextDisabled: {
    color: '#64748B'
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  presetsRow: {
    gap: 8,
    paddingBottom: 14
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)'
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  ampmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  ampmSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9
  },
  ampmBtnActive: {
    backgroundColor: '#5EEAD4'
  },
  ampmText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  ampmTextActive: {
    color: '#042F2E'
  },
  timePillsRow: {
    gap: 8,
    paddingBottom: 8
  },
  timePill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  timePillSelected: {
    backgroundColor: '#5EEAD4',
    borderColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8'
  },
  timePillTextSelected: {
    color: '#042F2E',
    fontWeight: '800'
  },
  minutesGrid: {
    flexDirection: 'row',
    gap: 8
  },
  minutePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  minutePillSelected: {
    backgroundColor: '#5EEAD4',
    borderColor: '#5EEAD4'
  },
  minutePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8'
  },
  minutePillTextSelected: {
    color: '#042F2E',
    fontWeight: '800'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8'
  },
  confirmActionBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  confirmActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.5
  }
});
