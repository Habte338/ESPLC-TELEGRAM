import React, { useState, useMemo } from 'react';
import {
  Ruler,
  Calculator,
  Check,
  ArrowRight,
  RotateCcw,
  Info,
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  Send,
  Layers,
  Divide,
  X,
  Equal,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import {
  CALCULATOR_MATERIALS_SEED,
  CALCULATOR_GAUGES,
  CALCULATOR_COLORS,
  STEEL_DENSITY_KG_PER_M3,
} from '../data/ethiopianSteelData';

export const RoofCalculatorTab: React.FC = () => {
  const { lang, applyCalculatorResultToOrder, checkStockAvailability, hapticFeedback } = useEthiopianSteel();

  // Selections
  const [selectedCoilWidth, setSelectedCoilWidth] = useState<number | null>(1000);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>('nc');
  const [selectedGaugeId, setSelectedGaugeId] = useState<string>('color032');
  const [selectedColorId, setSelectedColorId] = useState<string>('royal-blue');

  // Roofing Dimensions
  // 1. Total Roof Span / Place Length (in meters) - where sheets sit side by side
  const [roofSpanMeters, setRoofSpanMeters] = useState<string>('20');
  // 2. Number of roof slopes (1 side or 2 sides / gable)
  const [roofSlopes, setRoofSlopes] = useState<1 | 2>(1);
  // 3. Cut length per sheet piece (in meters) - down the slope from ridge to eave
  const [sheetCutLength, setSheetCutLength] = useState<string>('3.0');

  const [hasCalculated, setHasCalculated] = useState(true);

  const coilWidths = [1000, 1200, 1220];

  // Filter materials by selected coil width
  const filteredMaterials = useMemo(() => {
    if (!selectedCoilWidth) return CALCULATOR_MATERIALS_SEED;
    return CALCULATOR_MATERIALS_SEED.filter(m => m.coilWidth === selectedCoilWidth);
  }, [selectedCoilWidth]);

  // Active selected material
  const currentMaterial = useMemo(() => {
    return (
      CALCULATOR_MATERIALS_SEED.find(m => m.id === selectedMaterialId) ||
      filteredMaterials[0] ||
      CALCULATOR_MATERIALS_SEED[0]
    );
  }, [selectedMaterialId, filteredMaterials]);

  // Active selected gauge
  const currentGauge = useMemo(() => {
    return CALCULATOR_GAUGES.find(g => g.id === selectedGaugeId) || CALCULATOR_GAUGES[0];
  }, [selectedGaugeId]);

  // Active selected color
  const currentColor = useMemo(() => {
    return CALCULATOR_COLORS.find(c => c.id === selectedColorId) || CALCULATOR_COLORS[0];
  }, [selectedColorId]);

  const isColorGauge = currentGauge.group === 'COLOR';

  // Numeric Dimensions
  const numSpan = Math.max(0, parseFloat(roofSpanMeters) || 0);
  const numSheetLength = Math.max(0, parseFloat(sheetCutLength) || 0);
  const effectiveWidth = currentMaterial.effectiveWidth || 0.83;

  // --- Step 1: Calculate Total Number of Sheets Required ---
  // Divide total roof span length by effective cover width (with overlap)
  const rawSheetsPerSlope = effectiveWidth > 0 && numSpan > 0 ? numSpan / effectiveWidth : 0;
  const sheetsPerSlope = Math.ceil(rawSheetsPerSlope);
  const totalSheets = sheetsPerSlope * roofSlopes;

  // --- Step 2: Calculate Total Linear Meters (LM) to buy & pay for ---
  // Multiply total number of sheets by the cut length of each sheet piece
  const totalLinearMeters = Number((totalSheets * numSheetLength).toFixed(2));

  // --- Step 3: Estimated Steel Weight (kg) ---
  const estimatedWeightKg =
    currentGauge.thicknessMm && effectiveWidth && totalLinearMeters > 0
      ? totalLinearMeters *
        effectiveWidth *
        (currentGauge.thicknessMm / 1000) *
        STEEL_DENSITY_KG_PER_M3
      : null;

  // Stock check
  const stockStatus = checkStockAvailability(currentMaterial.id);

  const handleCalculate = () => {
    if (numSpan <= 0 || numSheetLength <= 0) {
      hapticFeedback('error');
      return;
    }
    hapticFeedback('success');
    setHasCalculated(true);
  };

  const handleTransferToOrder = () => {
    hapticFeedback('heavy');
    applyCalculatorResultToOrder({
      productId: currentMaterial.id,
      productName: currentMaterial.name,
      gaugeLabel: currentGauge.label,
      colorName: isColorGauge ? currentColor.name : undefined,
      lengthMeters: totalLinearMeters, // Total billable linear meters
      sheets: totalSheets,
      sheetLength: numSheetLength,
      spanLength: numSpan,
      slopes: roofSlopes,
      weightKg: estimatedWeightKg || undefined,
    });
  };

  return (
    <div id="roof-calculator-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4a8ac7] to-[#1e4b7a] border border-white/20 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#fdc672]" />
            <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
              {lang === 'am' ? 'የጣራ ስሌት ካልኩሌተር' : 'Roof Material Calculator'}
            </h2>
          </div>
          <p className="text-xs text-white/90 mt-1">
            {lang === 'am'
              ? 'የጣራዎን ርዝመት እና የቆርቆሮ ቁመት በማስገባት የሚያስፈልገውን የቆርቆሮ ብዛት እና ጠቅላላ ሊኒየር ሜትር (LM) በቀላሉ ያሰሉ'
              : 'Calculate total sheets needed & billable linear meters (LM) based on roof span length & sheet cut length'}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end text-xs text-white/70">
          <span className="font-black text-[#fdc672]">Ethiopian Steel PLC</span>
          <span>Official Spec Formula</span>
        </div>
      </div>

      {/* Stock Warning Banner if out of stock */}
      {!stockStatus.inStock && (
        <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 flex items-center gap-2.5 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <span className="font-bold">
              {lang === 'am' ? 'ይህ ምርት በአሁኑ ወቅት በመጋዘን አልቋል (Out of Stock)' : 'This item is currently Out of Stock'}
            </span>
            <p className="text-[11px] text-red-200/80 mt-0.5">
              {stockStatus.noteAm || stockStatus.noteEn || (lang === 'am' ? 'በትዕዛዝ ብቻ ይመረታል' : 'Special production batch required')}
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: Coil Width & Profile Selector */}
      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 shadow-md">
        <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span>{lang === 'am' ? 'የኮይል ስፋት እና የቆርቆሮ ዓይነት' : '1. Material & Coil Width'}</span>
          </span>
          <span className="text-[10px] text-white/50">1000mm / 1200mm / 1220mm</span>
        </label>

        {/* Coil width toggles */}
        <div className="flex items-center gap-2 pt-1">
          {coilWidths.map(w => {
            const isSelected = selectedCoilWidth === w;
            return (
              <button
                key={w}
                type="button"
                id={`coil-width-${w}`}
                onClick={() => {
                  hapticFeedback('light');
                  setSelectedCoilWidth(w);
                  const firstMatch = CALCULATOR_MATERIALS_SEED.find(m => m.coilWidth === w);
                  if (firstMatch) setSelectedMaterialId(firstMatch.id);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  isSelected
                    ? 'bg-[#4a8ac7] border-[#4a8ac7] text-white shadow-md'
                    : 'bg-[#15273d] border-white/10 text-white/70 hover:border-white/20'
                }`}
              >
                {w} mm Coil
              </button>
            );
          })}
        </div>

        {/* Material profiles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto pr-1">
          {filteredMaterials.map(m => {
            const isSelected = currentMaterial.id === m.id;
            const itemStock = checkStockAvailability(m.id);
            return (
              <button
                key={m.id}
                type="button"
                id={`calc-mat-${m.id}`}
                onClick={() => {
                  hapticFeedback('light');
                  setSelectedMaterialId(m.id);
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-[#15273d] border-[#fdc672] ring-1 ring-[#fdc672]/50 text-white shadow-sm'
                    : 'bg-[#0b1624] border-white/5 hover:border-white/15 text-white/80'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{m.name}</span>
                    {!itemStock.inStock && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30 whitespace-nowrap">
                        {lang === 'am' ? 'አልቋል' : 'Out'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a8ac7]/20 text-[#fdc672] font-bold border border-[#4a8ac7]/30">
                      {m.effectiveWidth}m {lang === 'am' ? 'ሽፋን ስፋት' : 'cover width'}
                    </span>
                    {m.overallWidth && (
                      <span className="text-[10px] text-white/50">
                        {m.overallWidth}m {lang === 'am' ? 'ጠቅላላ ስፋት' : 'overall'}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-xs flex-shrink-0 font-bold">
                    <Check className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-xs text-white/30 font-mono flex-shrink-0">›</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Total Roof Span Length (Where sheets sit side by side) */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 shadow-md">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span>
              {lang === 'am'
                ? 'የጣራው ጠቅላላ ርዝመት (Total Roof Span Length)'
                : '2. Total Roof Span Length to Cover'}
            </span>
          </label>
          <span className="text-[10px] text-[#fdc672] font-mono font-bold">
            {lang === 'am' ? 'የሚካፈለው በ: ' : 'Divides by: '}
            <strong>{effectiveWidth} m</strong>
          </span>
        </div>

        <p className="text-[11px] text-white/60">
          {lang === 'am'
            ? 'ቆርቆሮው ጎን ለጎን ተዘርግቶ የሚያርፍበት የቦታው ጠቅላላ ርዝመት (በሜትር)'
            : 'The total horizontal length of the building where roofing sheets will be set side-by-side'}
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              id="calc-roof-span-input"
              value={roofSpanMeters}
              onChange={e => {
                setRoofSpanMeters(e.target.value);
                setHasCalculated(true);
              }}
              min="0.5"
              step="0.5"
              placeholder="e.g. 20"
              className="w-full pl-3 pr-14 py-2.5 bg-[#15273d] border border-white/15 rounded-xl text-sm font-bold text-white focus:border-[#4a8ac7] focus:outline-hidden"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-white/50">
              Meters
            </span>
          </div>

          {/* Roof Slope Toggle (1 side or 2 sides) */}
          <div className="flex items-center bg-[#15273d] border border-white/15 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setRoofSlopes(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roofSlopes === 1
                  ? 'bg-[#4a8ac7] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {lang === 'am' ? '1 ወገን (1 Slope)' : '1 Slope'}
            </button>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setRoofSlopes(2);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roofSlopes === 2
                  ? 'bg-[#4a8ac7] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {lang === 'am' ? '2 ወገን (2 Slopes x2)' : '2 Slopes (x2)'}
            </button>
          </div>
        </div>

        {/* Quick Span Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/40 mr-1">{lang === 'am' ? 'ፈጣን ምርጫ:' : 'Presets:'}</span>
          {[10, 15, 20, 25, 30, 40, 50].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setRoofSpanMeters(String(val));
                setHasCalculated(true);
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                roofSpanMeters === String(val)
                  ? 'bg-[#fdc672] border-[#fdc672] text-[#0b1522] font-bold'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {val} m
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: Sheet Cut Length Per Piece */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 shadow-md">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span>
              {lang === 'am'
                ? 'የአንድ ቆርቆሮ ቁመት / ርዝመት (Cut Length per Piece)'
                : '3. Cut Length per Sheet Piece'}
            </span>
          </label>
          <span className="text-[10px] text-[#fdc672] font-mono font-bold">
            {lang === 'am' ? 'የሚባዛው በቆርቆሮ ብዛት' : 'Multiplied by Sheets'}
          </span>
        </div>

        <p className="text-[11px] text-white/60">
          {lang === 'am'
            ? 'ደንበኛው የሚፈልገው የአንድ ቆርቆሮ ቁልቁል ቁመት (ለምሳሌ 2.0m፣ 3.0m፣ 4.0m)'
            : 'The length of each sheet piece cut down the slope from ridge to eave (e.g. 2.0m, 3.0m)'}
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              id="calc-sheet-length-input"
              value={sheetCutLength}
              onChange={e => {
                setSheetCutLength(e.target.value);
                setHasCalculated(true);
              }}
              min="0.5"
              step="0.5"
              placeholder="e.g. 3"
              className="w-full pl-3 pr-14 py-2.5 bg-[#15273d] border border-white/15 rounded-xl text-sm font-bold text-white focus:border-[#4a8ac7] focus:outline-hidden"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-white/50">
              Meters
            </span>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            className="py-2.5 px-4 rounded-xl bg-[#fdc672] hover:bg-[#e5b05a] active:scale-[0.98] text-[#0b1522] text-xs font-black flex items-center gap-1.5 transition-all shadow-md"
          >
            <Calculator className="w-4 h-4" />
            <span>{lang === 'am' ? 'አስላ' : 'Calculate'}</span>
          </button>
        </div>

        {/* Quick Length Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/40 mr-1">{lang === 'am' ? 'መደበኛ ቁመቶች:' : 'Common cuts:'}</span>
          {[2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setSheetCutLength(String(val));
                setHasCalculated(true);
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                sheetCutLength === String(val)
                  ? 'bg-[#fdc672] border-[#fdc672] text-[#0b1522] font-bold'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {val} m
            </button>
          ))}
        </div>
      </div>

      {/* STEP 4: Gauge & Color Selection */}
      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 shadow-md">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] font-black">
              4
            </span>
            <span>{lang === 'am' ? 'ውፍረት እና ቀለም (Gauge & Color)' : '4. Gauge & Color'}</span>
          </label>
          <span className="text-xs font-bold text-[#fdc672] flex items-center gap-1">
            <Send className="w-3 h-3 text-[#4a8ac7]" />
            <span>{lang === 'am' ? 'ዋጋ በቴሌግራም' : 'Price via Telegram'}</span>
          </span>
        </div>

        <select
          id="calc-gauge-select"
          value={selectedGaugeId}
          onChange={e => {
            hapticFeedback('light');
            setSelectedGaugeId(e.target.value);
          }}
          className="w-full p-2.5 bg-[#15273d] border border-white/15 rounded-xl text-xs font-semibold text-white focus:border-[#4a8ac7] focus:outline-hidden"
        >
          {CALCULATOR_GAUGES.map(g => (
            <option key={g.id} value={g.id} className="bg-[#15273d] text-white">
              {g.label} ({g.thicknessMm ? `${g.thicknessMm}mm` : g.group})
            </option>
          ))}
        </select>

        {/* Color Grid (if COLOR gauge is selected) */}
        {isColorGauge && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-white/70">
                {lang === 'am' ? 'የቀለም ምርጫ:' : 'Color Palette:'}
              </span>
              <span className="text-[11px] font-bold text-[#fdc672]">{currentColor.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {CALCULATOR_COLORS.map(c => {
                const isSelected = selectedColorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      hapticFeedback('light');
                      setSelectedColorId(c.id);
                    }}
                    className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
                      isSelected ? 'ring-2 ring-[#fdc672] bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[9px] text-white/70 font-medium">{c.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CALCULATION RESULTS CARD - EXACT NUMERIC 2-STEP BREAKDOWN */}
      {hasCalculated && numSpan > 0 && numSheetLength > 0 && (
        <div
          id="calc-results-card"
          className="p-4 rounded-2xl bg-[#0f1d2e] border-2 border-[#fdc672] shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fdc672]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {lang === 'am' ? 'የስሌቱ ዝርዝር ውጤት (Calculation Breakdown)' : 'Calculation Breakdown'}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                stockStatus.inStock ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {stockStatus.inStock ? (lang === 'am' ? 'በመጋዘን አለ' : 'In Stock') : (lang === 'am' ? 'አልቋል' : 'Out of Stock')}
            </span>
          </div>

          {/* Transparent Step-by-Step Formula Box */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 flex flex-col gap-2.5 font-mono text-xs">
            {/* Step 1 in formula */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#fdc672] font-bold uppercase tracking-wider">
                {lang === 'am' ? 'ደረጃ 1: የቆርቆሮ ብዛት ስሌት (Sheets Needed)' : 'Step 1: Calculate Number of Sheets'}
              </span>
              <div className="flex items-center gap-1.5 text-white/90 flex-wrap">
                <span>{numSpan} m (Span)</span>
                <span className="text-[#4a8ac7]">÷</span>
                <span className="text-[#4a8ac7] font-bold">{effectiveWidth} m (Effective Width)</span>
                <span className="text-white/40">=</span>
                <span className="text-white/70">{rawSheetsPerSlope.toFixed(2)}</span>
                <span className="text-white/40">→</span>
                <strong className="text-[#fdc672]">{sheetsPerSlope} sheets</strong>
                {roofSlopes === 2 && (
                  <span className="text-white/70">× 2 slopes = <strong className="text-[#fdc672]">{totalSheets} sheets</strong></span>
                )}
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* Step 2 in formula */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                {lang === 'am' ? 'ደረጃ 2: ጠቅላላ ሊኒየር ሜትር (Total LM to Buy & Pay)' : 'Step 2: Calculate Total Linear Meters to Buy'}
              </span>
              <div className="flex items-center gap-1.5 text-white/90 flex-wrap">
                <strong className="text-[#fdc672]">{totalSheets} sheets</strong>
                <span className="text-emerald-400">×</span>
                <span className="text-emerald-400 font-bold">{numSheetLength} m (Cut Length)</span>
                <span className="text-white/40">=</span>
                <strong className="text-[#fdc672] text-sm bg-[#fdc672]/15 px-2 py-0.5 rounded border border-[#fdc672]/40">
                  {totalLinearMeters} LM
                </strong>
              </div>
            </div>
          </div>

          {/* Big Highlighted Results Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Metric 1: Total Sheets */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
              <span className="text-[10px] font-bold uppercase text-white/60">
                {lang === 'am' ? 'የቆርቆሮ ብዛት (Sheets)' : 'Total Sheets Required'}
              </span>
              <span className="text-xl font-black text-[#fdc672] font-mono mt-0.5">
                {totalSheets} Sheets
              </span>
              <span className="text-[10px] text-white/50 mt-0.5">
                {roofSlopes === 2 ? `${sheetsPerSlope} sheets / slope (x2)` : `For ${numSpan}m roof span`}
              </span>
            </div>

            {/* Metric 2: Total Linear Meters to Buy */}
            <div className="p-3 rounded-xl bg-[#4a8ac7]/20 border border-[#4a8ac7]/40 flex flex-col">
              <span className="text-[10px] font-bold uppercase text-[#fdc672]">
                {lang === 'am' ? 'ጠቅላላ ሊኒየር ሜትር (LM)' : 'Total Linear Meters'}
              </span>
              <span className="text-xl font-black text-white font-mono mt-0.5">
                {totalLinearMeters} LM
              </span>
              <span className="text-[10px] text-white/70 mt-0.5 font-medium">
                {lang === 'am' ? 'የሚከፈልበት መጠን (Billed LM)' : 'Primary Billed Unit'}
              </span>
            </div>

            {/* Metric 3: Sheet Cut Dimensions */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
              <span className="text-[10px] font-bold uppercase text-white/60">
                {lang === 'am' ? 'የአንድ ቆርቆሮ ቁመት' : 'Sheet Cut Length'}
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">
                {numSheetLength} m / piece
              </span>
              <span className="text-[10px] text-white/50 mt-0.5">
                {currentMaterial.name.split('/')[0]}
              </span>
            </div>

            {/* Metric 4: Estimated Weight */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col">
              <span className="text-[10px] font-bold uppercase text-white/60">
                {lang === 'am' ? 'ግምታዊ ክብደት' : 'Estimated Weight'}
              </span>
              <span className="text-sm font-bold text-[#fdc672] font-mono mt-0.5">
                {estimatedWeightKg ? `≈ ${estimatedWeightKg.toFixed(1)} kg` : 'N/A'}
              </span>
              <span className="text-[10px] text-white/50 mt-0.5">
                {currentGauge.label}
              </span>
            </div>
          </div>

          {/* Telegram Pricing Explainer */}
          <div className="p-3 rounded-xl bg-[#4a8ac7]/15 border border-[#4a8ac7]/30 flex items-start gap-2.5 text-xs text-white/90">
            <Send className="w-4 h-4 text-[#fdc672] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#fdc672]">
                {lang === 'am' ? 'ክፍያ በሊኒየር ሜትር (በLM) የሚሰላ ሲሆን ዋጋው በቴሌግራም ይላካል' : 'Billed per Linear Meter (LM) · Quote via Telegram'}
              </span>
              <p className="text-[11px] text-white/80 mt-0.5">
                {lang === 'am'
                  ? `የኢትዮጵያን ስቲል የሽያጭ ክፍል ለዚህ ${totalLinearMeters} LM ትዕዛዝዎን አይቶ የጠቅላላ ዋጋውን ዝርዝር (ከነ ቅናሹ) በቀጥታ ወደ ቴሌግራም መታወቂያዎ ይልክልዎታል።`
                  : `Ethiopian Steel sales calculates price per linear meter. The factory bot owner will send your official invoice quote for ${totalLinearMeters} LM directly to your Telegram.`}
              </p>
            </div>
          </div>

          {/* Action button: Transfer to Order tab */}
          <button
            type="button"
            id="calc-add-to-order-btn"
            onClick={handleTransferToOrder}
            className="w-full py-3 px-4 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#4a8ac7]/30 border border-white/20"
          >
            <ShoppingCart className="w-4 h-4 text-[#fdc672]" />
            <span>
              {lang === 'am'
                ? `ይህንን (${totalLinearMeters} LM) ወደ ማዘዣው ቅጽ ላክ`
                : `Transfer (${totalLinearMeters} LM) to Order Builder`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
