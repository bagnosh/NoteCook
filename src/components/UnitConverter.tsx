import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';
import {
  DENSITY_PRESETS, DRY_UNITS, DRY_UNIT_LABELS, DryUnit,
  LIQUID_UNITS, LIQUID_UNIT_LABELS, LiquidUnit,
  celsiusToFahrenheit, convertDry, convertLiquid, fahrenheitToCelsius, roundResult,
} from '../constants/units';

type Mode = 'temp' | 'dry' | 'liquid';

function ConversionRow<T extends string>({
  value, onChangeValue, fromUnit, toUnit, units, labels, onChangeFrom, onChangeTo, result,
}: {
  value: string;
  onChangeValue: (v: string) => void;
  fromUnit: T;
  toUnit: T;
  units: T[];
  labels: Record<T, string>;
  onChangeFrom: (u: T) => void;
  onChangeTo: (u: T) => void;
  result: string;
}) {
  function swap() {
    onChangeFrom(toUnit);
    onChangeTo(fromUnit);
  }

  return (
    <View style={styles.conversionRow}>
      <Text style={styles.fieldLabel}>From</Text>
      <View style={styles.unitRow}>
        {units.map(u => (
          <TouchableOpacity
            key={u}
            style={[styles.unitChip, fromUnit === u && styles.unitChipActive]}
            onPress={() => onChangeFrom(u)}
          >
            <Text style={[styles.unitChipText, fromUnit === u && styles.unitChipTextActive]}>
              {labels[u]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.valueRow}>
        <TextInput
          style={styles.valueInput}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeValue}
        />
        <TouchableOpacity style={styles.swapBtn} onPress={swap}>
          <Ionicons name="swap-vertical" size={18} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>To</Text>
      <View style={styles.unitRow}>
        {units.map(u => (
          <TouchableOpacity
            key={u}
            style={[styles.unitChip, toUnit === u && styles.unitChipActive]}
            onPress={() => onChangeTo(u)}
          >
            <Text style={[styles.unitChipText, toUnit === u && styles.unitChipTextActive]}>
              {labels[u]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>
          {result !== '' ? `${result} ${labels[toUnit]}` : '—'}
        </Text>
      </View>
    </View>
  );
}

export default function UnitConverter() {
  const [mode, setMode] = useState<Mode>('temp');

  // Temperature
  const [celsius, setCelsius] = useState('0');
  const [fahrenheit, setFahrenheit] = useState('32');

  function onCelsiusChange(text: string) {
    setCelsius(text);
    const n = parseFloat(text);
    setFahrenheit(isNaN(n) ? '' : roundResult(celsiusToFahrenheit(n)).toString());
  }
  function onFahrenheitChange(text: string) {
    setFahrenheit(text);
    const n = parseFloat(text);
    setCelsius(isNaN(n) ? '' : roundResult(fahrenheitToCelsius(n)).toString());
  }

  // Dry (weight <-> volume, needs a density reference)
  const [dryValue, setDryValue] = useState('1');
  const [dryFrom, setDryFrom] = useState<DryUnit>('cup');
  const [dryTo, setDryTo] = useState<DryUnit>('g');
  const [selectedPreset, setSelectedPreset] = useState(DENSITY_PRESETS[1].label);
  const [gramsPerCup, setGramsPerCup] = useState(DENSITY_PRESETS[1].gramsPerCup);
  const [customDensity, setCustomDensity] = useState(String(DENSITY_PRESETS[1].gramsPerCup));

  const dryResult = useMemo(() => {
    const n = parseFloat(dryValue);
    if (isNaN(n) || gramsPerCup <= 0) return '';
    return roundResult(convertDry(n, dryFrom, dryTo, gramsPerCup)).toString();
  }, [dryValue, dryFrom, dryTo, gramsPerCup]);

  // Liquid (pure volume, no density needed)
  const [liquidValue, setLiquidValue] = useState('1');
  const [liquidFrom, setLiquidFrom] = useState<LiquidUnit>('cup');
  const [liquidTo, setLiquidTo] = useState<LiquidUnit>('flOz');

  const liquidResult = useMemo(() => {
    const n = parseFloat(liquidValue);
    if (isNaN(n)) return '';
    return roundResult(convertLiquid(n, liquidFrom, liquidTo)).toString();
  }, [liquidValue, liquidFrom, liquidTo]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.modeRow}>
        {(['temp', 'dry', 'liquid'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'temp' ? 'Temperature' : m === 'dry' ? 'Dry' : 'Liquid'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'temp' && (
        <View style={styles.section}>
          <View style={styles.tempRow}>
            <View style={styles.tempField}>
              <Text style={styles.fieldLabel}>°C</Text>
              <TextInput
                style={styles.valueInput}
                keyboardType="numeric"
                value={celsius}
                onChangeText={onCelsiusChange}
              />
            </View>
            <Ionicons name="swap-horizontal" size={20} color={theme.colors.buttonPrimary} />
            <View style={styles.tempField}>
              <Text style={styles.fieldLabel}>°F</Text>
              <TextInput
                style={styles.valueInput}
                keyboardType="numeric"
                value={fahrenheit}
                onChangeText={onFahrenheitChange}
              />
            </View>
          </View>
        </View>
      )}

      {mode === 'dry' && (
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Density reference</Text>
          <View style={styles.unitRow}>
            {DENSITY_PRESETS.map(p => (
              <TouchableOpacity
                key={p.label}
                style={[styles.unitChip, selectedPreset === p.label && styles.unitChipActive]}
                onPress={() => {
                  setSelectedPreset(p.label);
                  setGramsPerCup(p.gramsPerCup);
                }}
              >
                <Text style={[styles.unitChipText, selectedPreset === p.label && styles.unitChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.unitChip, selectedPreset === 'Custom' && styles.unitChipActive]}
              onPress={() => setSelectedPreset('Custom')}
            >
              <Text style={[styles.unitChipText, selectedPreset === 'Custom' && styles.unitChipTextActive]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {selectedPreset === 'Custom' && (
            <View style={styles.customDensityRow}>
              <TextInput
                style={styles.customDensityInput}
                keyboardType="numeric"
                value={customDensity}
                onChangeText={(t) => {
                  setCustomDensity(t);
                  const n = parseFloat(t);
                  if (!isNaN(n)) setGramsPerCup(n);
                }}
              />
              <Text style={styles.fieldLabel}>grams per cup</Text>
            </View>
          )}

          <ConversionRow
            value={dryValue}
            onChangeValue={setDryValue}
            fromUnit={dryFrom}
            toUnit={dryTo}
            units={DRY_UNITS}
            labels={DRY_UNIT_LABELS}
            onChangeFrom={setDryFrom}
            onChangeTo={setDryTo}
            result={dryResult}
          />
        </View>
      )}

      {mode === 'liquid' && (
        <View style={styles.section}>
          <ConversionRow
            value={liquidValue}
            onChangeValue={setLiquidValue}
            fromUnit={liquidFrom}
            toUnit={liquidTo}
            units={LIQUID_UNITS}
            labels={LIQUID_UNIT_LABELS}
            onChangeFrom={setLiquidFrom}
            onChangeTo={setLiquidTo}
            result={liquidResult}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.buttonPrimary,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.buttonPrimary,
  },
  modeBtnTextActive: {
    color: theme.colors.headerText,
  },
  section: {
    gap: 12,
  },
  conversionRow: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    opacity: 0.6,
    marginTop: 4,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempField: {
    flex: 1,
    gap: 4,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
  },
  unitChipActive: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  unitChipTextActive: {
    color: theme.colors.headerText,
  },
  customDensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDensityInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: theme.colors.text,
    width: 80,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valueInput: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBox: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});
