// Основной объект приложения
const MyRiskApp = {
    minAge: 15,
    
    // Константы SCORE2 для России (страна очень высокого риска)
    SCORE2_COEFFICIENTS: {
        // Базовый риск по возрасту и полу (на 10 лет, %)
        // Формат: [возраст_начало, возраст_конец]: { male: [некурящий, курящий], female: [некурящая, курящая] }
        baseRisk: {
            '40-49': { male: [0.5, 1.1], female: [0.2, 0.6] },
            '50-59': { male: [1.7, 3.5], female: [0.8, 1.8] },
            '60-69': { male: [4.2, 8.0], female: [2.0, 4.0] },
            '70-89': { male: [9.0, 15.0], female: [5.0, 10.0] }
        },
        // Множители для факторов риска
        multipliers: {
            sbp: {
                // Систолическое АД: множитель к базовому риску
                '120-129': 1.0,
                '130-139': 1.3,
                '140-159': 1.8,
                '160-179': 2.4,
                '180+': 3.0
            },
            cholesterol: {
                // Общий холестерин ммоль/л: множитель
                '<4.0': 0.8,
                '4.0-4.9': 1.0,
                '5.0-5.9': 1.3,
                '6.0-7.9': 1.7,
                '8.0+': 2.2
            },
            diabetes: 1.5,      // Множитель при диабете
            obesity: 1.3,       // Множитель при ожирении (ИМТ ≥ 30)
            familyEarly: 1.4    // Множитель при семейном анамнезе ранних ССЗ
        }
    },
    
    // Инициализация приложения
    init: function() {
        this.setupEventListeners();
        this.calculateBMI();
        this.updateProgress();
        this.initPoll();   // <-- добавлено для опроса
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Навигация по вкладкам
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Кнопка перехода к анкете
        document.querySelector('.go-to-questionnaire')?.addEventListener('click', () => {
            this.switchTab('questionnaire');
        });
        
        // Расчет ИМТ при вводе роста и веса
        document.getElementById('height')?.addEventListener('input', () => this.calculateBMI());
        document.getElementById('weight')?.addEventListener('input', () => this.calculateBMI());
        
        // Обработка формы
        document.getElementById('risk-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateRisk();
        });
        
        // Кнопка сброса формы
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить все поля?')) {
                document.getElementById('risk-form').reset();
                this.calculateBMI();
                this.updateProgress();
            }
        });
        
        // Обновление прогресса при изменении полей
        document.querySelectorAll('#risk-form input, #risk-form select').forEach(field => {
            field.addEventListener('change', () => this.updateProgress());
            field.addEventListener('input', () => this.updateProgress());
        });
        
        // Модальное окно
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            document.getElementById('emergency-modal').classList.remove('active');
        });
        
        document.getElementById('close-emergency')?.addEventListener('click', () => {
            document.getElementById('emergency-modal').classList.remove('active');
        });
        
        document.getElementById('call-ambulance')?.addEventListener('click', () => {
            alert('Наберите 103 или 112 для вызова скорой помощи');
        });
        
        document.getElementById('emergency-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'emergency-modal') {
                e.target.classList.remove('active');
            }
        });
        
        // Показать/скрыть дополнительные поля лаборатории
        const labToggle = document.getElementById('lab_toggle');
        labToggle?.addEventListener('change', (e) => {
            const labFields = document.getElementById('lab-fields');
            if (labFields) {
                labFields.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    },
    
    // Переключение между вкладками
    switchTab: function(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    // Расчет индекса массы тела
    calculateBMI: function() {
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const bmiResult = document.getElementById('bmi-result');
        
        if (!heightInput || !weightInput || !bmiResult) return;
        
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);
        
        if (height && weight && height > 0 && weight > 0) {
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const bmiRounded = bmi.toFixed(1);
            
            let bmiCategory = '';
            let bmiColor = '#2A5C8A';
            
            if (bmi < 18.5) {
                bmiCategory = ' (Недостаточный вес)';
                bmiColor = '#ff9800';
            } else if (bmi < 25) {
                bmiCategory = ' (Нормальный вес)';
                bmiColor = '#4CAF50';
            } else if (bmi < 30) {
                bmiCategory = ' (Избыточный вес)';
                bmiColor = '#FFC107';
            } else {
                bmiCategory = ' (Ожирение)';
                bmiColor = '#F44336';
            }
            
            bmiResult.textContent = `${bmiRounded}${bmiCategory}`;
            bmiResult.style.color = bmiColor;
        } else {
            bmiResult.textContent = '—';
            bmiResult.style.color = '#666';
        }
    },
    
    // Обновление прогресса заполнения формы
    updateProgress: function() {
        const form = document.getElementById('risk-form');
        if (!form) return;
        
        const requiredFields = form.querySelectorAll('[required]');
        let filledCount = 0;
        
        requiredFields.forEach(field => {
            if (field.type === 'number' && field.value !== '' && parseFloat(field.value) > 0) {
                filledCount++;
            } else if (field.type === 'select-one' && field.value !== '') {
                filledCount++;
            }
        });
        
        const progress = (filledCount / requiredFields.length) * 100;
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
    },
    
    // Основная функция расчета риска
    calculateRisk: function() {
        const formData = this.collectFormData();
        
        const validation = this.validateFormData(formData);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }
        
        // Рассчитываем риск по всем шкалам
        const riskResult = this.calculateComprehensiveRisk(formData);
        
        // Отображаем результат
        this.displayRiskResult(riskResult);
        
        // Переключаемся на вкладку с результатом
        this.switchTab('result');
        
        // ========== ОТПРАВКА СОБЫТИЯ В ЯНДЕКС.МЕТРИКУ ==========
        if (typeof ym !== 'undefined') {
            try {
                ym(109308547, 'reachGoal', 'test_completed');
                console.log('Метрика: событие test_completed отправлено');
            } catch(e) {
                console.log('Ошибка отправки события в Метрику:', e);
            }
        } else {
            console.log('Метрика не загружена');
        }
        // =====================================================
        
        // ========== ПОКАЗЫВАЕМ ОПРОС ПОСЛЕ ТЕСТА ==========
        this.showPoll();
        // ===================================================
        
        // Если риск высокий - показываем модальное окно
        if (riskResult.riskLevel === 'very-high' || riskResult.riskLevel === 'high') {
            setTimeout(() => {
                document.getElementById('emergency-modal').classList.add('active');
            }, 1000);
        }
    },
    
    // ================= НОВЫЕ МЕТОДЫ ДЛЯ ОПРОСА =================
    
    // Показывает модальное окно с вопросом о страховом полисе (один раз за сессию)
    showPoll: function() {
        if (window.pollShown) return;
        window.pollShown = true;
        const modal = document.getElementById('poll-modal');
        if (!modal) return;
        setTimeout(() => {
            modal.classList.add('active');
        }, 1500);
    },
    
    // Инициализация обработчиков для модального окна опроса
    initPoll: function() {
        const modal = document.getElementById('poll-modal');
        if (!modal) return;
        
        const closeBtn = modal.querySelector('.close-poll');
        const yesBtn = document.getElementById('poll-yes');
        const noBtn = document.getElementById('poll-no');
        const closeModal = () => modal.classList.remove('active');
        
        closeBtn?.addEventListener('click', closeModal);
        
        yesBtn?.addEventListener('click', () => {
            if (typeof ym !== 'undefined') {
                ym(109308547, 'reachGoal', 'poll_yes');
                console.log('Метрика: poll_yes');
            }
            alert('Спасибо за ответ!');
            closeModal();
        });
        
        noBtn?.addEventListener('click', () => {
            if (typeof ym !== 'undefined') {
                ym(109308547, 'reachGoal', 'poll_no');
                console.log('Метрика: poll_no');
            }
            alert('Спасибо за ответ!');
            closeModal();
        });
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    },
    
    // =========================================================
    
    // Сбор данных из формы
    collectFormData: function() {
        const getValue = (id) => document.getElementById(id)?.value || '';
        const getNumeric = (id) => {
            const val = document.getElementById(id)?.value;
            return val ? parseFloat(val) : null;
        };
        
        return {
            age: parseInt(getValue('age')) || 0,
            gender: getValue('gender'),
            height: parseFloat(getValue('height')) || 0,
            weight: parseFloat(getValue('weight')) || 0,
            familyHistory: getValue('family_history'),
            activity: getValue('activity'),
            smoking: getValue('smoking'),
            systolicBP: parseInt(getValue('systolic_bp')) || 0,
            diastolicBP: parseInt(document.getElementById('diastolic_bp')?.value) || 0,
            bpMedication: getValue('bp_medication'),
            diabetes: getValue('diabetes'),
            diabetesDuration: getValue('diabetes_duration'),
            cholesterol: getNumeric('cholesterol'),
            ldlCholesterol: getNumeric('ldl_cholesterol'),
            hdlCholesterol: getNumeric('hdl_cholesterol'),
            triglycerides: getNumeric('triglycerides'),
            glucose: getNumeric('glucose'),
            afibHistory: getValue('afib_history'),
            strokeHistory: getValue('stroke_history'),
            cadHistory: getValue('cad_history'),
            atherosclerosis: getValue('atherosclerosis'),
            kidneyDisease: getValue('kidney_disease'),
            statins: getValue('statins'),
            anticoagulants: getValue('anticoagulants'),
            alcohol: getValue('alcohol'),
            palpitations: getValue('palpitations') || 'rarely',
            shortnessBreath: getValue('shortness_breath') || 'rarely',
            dizziness: getValue('dizziness') || 'rarely'
        };
    },
    
    // Валидация данных
    validateFormData: function(data) {
        if (!data.age || data.age < this.minAge || data.age > 120) {
            return {
                valid: false,
                message: `Пожалуйста, введите корректный возраст (от ${this.minAge} до 120 лет)`
            };
        }
        
        const requiredFields = [
            { field: data.gender, name: 'Пол' },
            { field: data.height, name: 'Рост', min: 100, max: 250 },
            { field: data.weight, name: 'Вес', min: 30, max: 300 },
            { field: data.familyHistory, name: 'Наследственность' },
            { field: data.activity, name: 'Физическая активность' },
            { field: data.smoking, name: 'Статус курения' },
            { field: data.systolicBP, name: 'Систолическое АД', min: 70, max: 250 },
            { field: data.bpMedication, name: 'Прием лекарств от давления' },
            { field: data.diabetes, name: 'Сахарный диабет' },
            { field: data.afibHistory, name: 'Мерцательная аритмия' },
            { field: data.strokeHistory, name: 'Инсульт/ТИА в анамнезе' }
        ];
        
        for (let field of requiredFields) {
            if (!field.field || field.field === '') {
                return {
                    valid: false,
                    message: `Пожалуйста, заполните поле: "${field.name}"`
                };
            }
            
            if (field.min && field.max && (field.field < field.min || field.field > field.max)) {
                return {
                    valid: false,
                    message: `Пожалуйста, введите корректное значение для "${field.name}" (от ${field.min} до ${field.max})`
                };
            }
        }
        
        return { valid: true, message: '' };
    },
    
    // ============ НОВАЯ СИСТЕМА РАСЧЁТА ============
    
    calculateComprehensiveRisk: function(data) {
        const heightInMeters = data.height / 100;
        const bmi = data.weight / (heightInMeters * heightInMeters);
        
        // Определяем, есть ли уже ССЗ (вторичная профилактика)
        const hasEstablishedCVD = (data.strokeHistory === 'yes' || 
                                    data.cadHistory === 'yes' || 
                                    data.atherosclerosis === 'yes');
        
        let primaryRisk = 0;
        let score2Risk = null;
        let framinghamRisk = null;
        let abcd2Risk = null;
        let chads2vascRisk = null;
        
        if (hasEstablishedCVD) {
            // Вторичная профилактика — используем ABCD² и CHA₂DS₂-VASc
            abcd2Risk = this.calculateABCD2Risk(data);
            chads2vascRisk = this.calculateCHADS2VAScRisk(data);
            
            // Базовый риск при вторичной профилактике
            primaryRisk = 3.0; // Базовый 6-месячный риск при наличии ССЗ
            
            if (data.strokeHistory === 'yes') {
                primaryRisk += abcd2Risk.sixMonthRisk * 0.5;
            }
            
            if (data.afibHistory === 'yes') {
                primaryRisk += chads2vascRisk.sixMonthRisk * 0.5;
            }
            
            // Снижение риска при терапии
            if (data.statins === 'yes') primaryRisk *= 0.7;
            if (data.anticoagulants === 'yes') primaryRisk *= 0.5;
            
        } else {
            // Первичная профилактика — используем SCORE2 и Фрамингем
            score2Risk = this.calculateSCORE2Risk(data, bmi);
            framinghamRisk = this.calculateFraminghamRisk(data);
            
            // Основной риск — SCORE2 (адаптированный на 6 месяцев)
            // SCORE2 даёт 10-летний риск, делим на 20 для 6-месячной оценки
            primaryRisk = score2Risk.tenYearRisk / 20;
            
            // Если есть мерцательная аритмия, добавляем CHA₂DS₂-VASc
            if (data.afibHistory === 'yes') {
                chads2vascRisk = this.calculateCHADS2VAScRisk(data);
                primaryRisk += chads2vascRisk.sixMonthRisk * 0.3;
            }
        }
        
        // Дополнительные корректировки (аддитивные, не мультипликативные!)
        const adjustments = this.calculateAdjustments(data, bmi);
        primaryRisk += adjustments.total;
        
        // Ограничение: минимум 0.01%, максимум 15% для 6 месяцев
        primaryRisk = Math.max(0.01, Math.min(primaryRisk, 15));
        
        // Округляем до 2 знаков
        primaryRisk = Math.round(primaryRisk * 100) / 100;
        
        // Определяем уровень риска
        let riskLevel, probability;
        if (primaryRisk < 1) {
            riskLevel = 'low';
            probability = 'низкий';
        } else if (primaryRisk < 5) {
            riskLevel = 'moderate';
            probability = 'умеренный';
        } else if (primaryRisk < 10) {
            riskLevel = 'high';
            probability = 'высокий';
        } else {
            riskLevel = 'very-high';
            probability = 'очень высокий';
        }
        
        // Определяем факторы риска
        const riskFactors = this.identifyRiskFactors(data, bmi);
        
        return {
            sixMonthRisk: primaryRisk.toFixed(2),
            riskLevel: riskLevel,
            probability: probability,
            factors: riskFactors,
            bmi: bmi.toFixed(1),
            hasEstablishedCVD: hasEstablishedCVD,
            adjustments: adjustments,
            score2Risk: score2Risk,
            framinghamRisk: framinghamRisk,
            abcd2Risk: abcd2Risk,
            chads2vascRisk: chads2vascRisk
        };
    },
    
    // SCORE2 — современная европейская шкала (Россия = страна очень высокого риска)
    calculateSCORE2Risk: function(data, bmi) {
        // Определяем возрастную группу
        let ageGroup = '40-49';
        if (data.age < 40) ageGroup = '40-49'; // Экстраполируем для молодых
        else if (data.age < 50) ageGroup = '40-49';
        else if (data.age < 60) ageGroup = '50-59';
        else if (data.age < 70) ageGroup = '60-69';
        else ageGroup = '70-89';
        
        // Получаем базовый риск для возрастной группы
        const sexKey = data.gender === 'female' ? 'female' : 'male';
        const smokingIndex = data.smoking === 'current' ? 1 : 0;
        const baseRiskData = this.SCORE2_COEFFICIENTS.baseRisk[ageGroup];
        let baseRisk = baseRiskData[sexKey][smokingIndex];
        
        // Если моложе 40 — снижаем базовый риск
        if (data.age < 40) {
            baseRisk *= 0.3;
        }
        
        // Применяем множители SCORE2
        let adjustedRisk = baseRisk;
        
        // Коррекция на систолическое АД
        if (data.systolicBP >= 180) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.sbp['180+'];
        else if (data.systolicBP >= 160) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.sbp['160-179'];
        else if (data.systolicBP >= 140) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.sbp['140-159'];
        else if (data.systolicBP >= 130) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.sbp['130-139'];
        
        // Коррекция на холестерин (не-ЛПВП)
        if (data.cholesterol) {
            if (data.cholesterol >= 8.0) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.cholesterol['8.0+'];
            else if (data.cholesterol >= 6.0) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.cholesterol['6.0-7.9'];
            else if (data.cholesterol >= 5.0) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.cholesterol['5.0-5.9'];
            else if (data.cholesterol < 4.0) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.cholesterol['<4.0'];
        }
        
        // Коррекция на диабет
        if (data.diabetes === 'yes') adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.diabetes;
        
        // Ожирение
        if (bmi >= 30) adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.obesity;
        
        // Семейный анамнез ранних ССЗ (используем общий семейный анамнез как прокси)
        if (data.familyHistory === 'yes') adjustedRisk *= this.SCORE2_COEFFICIENTS.multipliers.familyEarly;
        
        return {
            ageGroup: ageGroup,
            baseRisk: baseRisk,
            tenYearRisk: adjustedRisk,
            riskCategory: adjustedRisk < 2.5 ? 'низкий/умеренный' : 
                          adjustedRisk < 7.5 ? 'высокий' : 'очень высокий'
        };
    },
    
    // Расчет риска по шкале Фрамингема (адаптированная версия)
    calculateFraminghamRisk: function(data) {
        let points = 0;
        
        // Возраст
        if (data.age < 45) points += 0;
        else if (data.age < 55) points += 2;
        else if (data.age < 65) points += 4;
        else if (data.age < 75) points += 6;
        else points += 8;
        
        // Пол
        if (data.gender === 'female') points += 1;
        
        // Систолическое давление
        if (data.bpMedication === 'yes') {
            if (data.systolicBP >= 160) points += 6;
            else if (data.systolicBP >= 140) points += 4;
            else if (data.systolicBP >= 130) points += 3;
            else if (data.systolicBP >= 120) points += 2;
        } else {
            if (data.systolicBP >= 160) points += 4;
            else if (data.systolicBP >= 140) points += 3;
            else if (data.systolicBP >= 130) points += 2;
            else if (data.systolicBP >= 120) points += 1;
        }
        
        // Курение
        if (data.smoking === 'current') points += 3;
        else if (data.smoking === 'former') points += 1;
        
        // Диабет
        if (data.diabetes === 'yes') {
            points += 3;
            if (data.diabetesDuration === 'long') points += 1; // +1 балл за длительный диабет
        } else if (data.diabetes === 'prediabetes') points += 1;
        
        // Мерцательная аритмия
        if (data.afibHistory === 'yes') points += 6;
        
        // Предыдущий инсульт/ТИА
        if (data.strokeHistory === 'yes') points += 8;
        
        // ИБС/атеросклероз
        if (data.cadHistory === 'yes' || data.atherosclerosis === 'yes') points += 5;
        
        // Семейный анамнез
        if (data.familyHistory === 'yes') points += 2;
        
        // Хроническая болезнь почек
        if (data.kidneyDisease === 'yes') points += 3;
        
        // Конвертация баллов в 10-летний риск
        let tenYearRisk = 0;
        if (points <= 5) tenYearRisk = 1;
        else if (points <= 10) tenYearRisk = 3;
        else if (points <= 15) tenYearRisk = 8;
        else if (points <= 20) tenYearRisk = 15;
        else if (points <= 25) tenYearRisk = 25;
        else if (points <= 30) tenYearRisk = 35;
        else tenYearRisk = 45;
        
        return {
            points: points,
            tenYearRisk: tenYearRisk,
            riskCategory: points <= 10 ? 'низкий' : points <= 20 ? 'умеренный' : 'высокий'
        };
    },
    
    // Расчет риска по шкале ABCD²
    calculateABCD2Risk: function(data) {
        let score = 0;
        
        // Возраст ≥60 лет
        if (data.age >= 60) score += 1;
        
        // Артериальное давление ≥140/90 мм рт.ст.
        if (data.systolicBP >= 140 || (data.diastolicBP && data.diastolicBP >= 90)) score += 1;
        
        // Клинические особенности
        if (data.dizziness === 'often' || data.shortnessBreath === 'often') score += 2;
        else if (data.dizziness === 'rarely' || data.shortnessBreath === 'rarely') score += 1;
        
        // Длительность симптомов
        if (data.strokeHistory === 'yes') score += 2;
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Расчет риска
        let twoDayRisk, sevenDayRisk, sixMonthRisk;
        
        if (score <= 3) {
            twoDayRisk = 1.0;
            sevenDayRisk = 1.2;
            sixMonthRisk = 3.0;
        } else if (score <= 5) {
            twoDayRisk = 4.1;
            sevenDayRisk = 5.9;
            sixMonthRisk = 9.0;
        } else {
            twoDayRisk = 8.1;
            sevenDayRisk = 11.7;
            sixMonthRisk = 15.0;
        }
        
        return {
            score: score,
            twoDayRisk: twoDayRisk,
            sevenDayRisk: sevenDayRisk,
            sixMonthRisk: sixMonthRisk,
            riskCategory: score <= 3 ? 'низкий' : score <= 5 ? 'умеренный' : 'высокий'
        };
    },
    
    // Расчет риска по шкале CHA₂DS₂-VASc
    calculateCHADS2VAScRisk: function(data) {
        let score = 0;
        
        // Сердечная недостаточность (одышка как прокси)
        if (data.shortnessBreath === 'often') score += 1;
        
        // Артериальная гипертензия
        if (data.systolicBP >= 140 || data.bpMedication === 'yes') score += 1;
        
        // Возраст ≥75 лет
        if (data.age >= 75) score += 2;
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Инсульт/ТИА в анамнезе
        if (data.strokeHistory === 'yes') score += 2;
        
        // Сосудистые заболевания
        if (data.cadHistory === 'yes' || data.atherosclerosis === 'yes' || data.age >= 65) score += 1;
        
        // Пол (женский)
        if (data.gender === 'female') score += 1;
        
        // Возраст 65-74 года
        if (data.age >= 65 && data.age <= 74) score += 1;
        
        // Расчет годового риска инсульта
        const riskMap = {
            0: 0.0, 1: 1.3, 2: 2.2, 3: 3.2,
            4: 4.0, 5: 6.7, 6: 9.8, 7: 9.6,
            8: 12.5, 9: 15.2
        };
        
        const strokeRisk = riskMap[Math.min(score, 9)] || 15.2;
        const sixMonthRisk = strokeRisk / 2;
        
        let anticoagulation = 'не показаны';
        if (score >= 2) anticoagulation = 'показаны';
        else if (score === 1) anticoagulation = 'рассмотреть';
        
        return {
            score: score,
            strokeRisk: strokeRisk,
            sixMonthRisk: sixMonthRisk,
            anticoagulation: anticoagulation
        };
    },
    
    // Аддитивные корректировки (замена мультипликативных)
    calculateAdjustments: function(data, bmi) {
        let total = 0;
        const details = [];
        
        // Физическая активность
        if (data.activity === 'sedentary') {
            total += 0.5;
            details.push({ factor: 'Малоподвижный образ жизни', adjustment: '+0.5%' });
        }
        
        // Ожирение
        if (bmi >= 35) {
            total += 0.8;
            details.push({ factor: 'Ожирение III степени (ИМТ ≥ 35)', adjustment: '+0.8%' });
        } else if (bmi >= 30) {
            total += 0.4;
            details.push({ factor: 'Ожирение (ИМТ 30-34.9)', adjustment: '+0.4%' });
        }
        
        // Алкоголь
        if (data.alcohol === 'heavy') {
            total += 0.6;
            details.push({ factor: 'Злоупотребление алкоголем', adjustment: '+0.6%' });
        }
        
        // Высокий холестерин (дополнительно к SCORE2)
        if (data.ldlCholesterol && data.ldlCholesterol >= 4.9) {
            total += 0.5;
            details.push({ factor: 'ЛПНП ≥ 4.9 ммоль/л', adjustment: '+0.5%' });
        }
        
        // Высокий уровень глюкозы
        if (data.glucose && data.glucose >= 7.0) {
            total += 0.8;
            details.push({ factor: 'Глюкоза натощак ≥ 7.0 ммоль/л', adjustment: '+0.8%' });
        } else if (data.glucose && data.glucose >= 6.1) {
            total += 0.4;
            details.push({ factor: 'Глюкоза натощак 6.1-6.9 ммоль/л', adjustment: '+0.4%' });
        }
        
        // Низкий ЛПВП
        if (data.hdlCholesterol && data.hdlCholesterol < 1.0 && data.gender === 'male') {
            total += 0.3;
            details.push({ factor: 'Низкий ЛПВП (< 1.0 ммоль/л)', adjustment: '+0.3%' });
        } else if (data.hdlCholesterol && data.hdlCholesterol < 1.2 && data.gender === 'female') {
            total += 0.3;
            details.push({ factor: 'Низкий ЛПВП (< 1.2 ммоль/л)', adjustment: '+0.3%' });
        }
        
        // ХБП
        if (data.kidneyDisease === 'yes') {
            total += 1.5;
            details.push({ factor: 'Хроническая болезнь почек', adjustment: '+1.5%' });
        }
        
        // Защитные факторы — снижение риска
        if (data.statins === 'yes') {
            total -= 0.3;
            details.push({ factor: 'Приём статинов', adjustment: '-0.3%' });
        }
        
        if (data.anticoagulants === 'yes' && data.afibHistory === 'yes') {
            total -= 1.0;
            details.push({ factor: 'Приём антикоагулянтов при ФП', adjustment: '-1.0%' });
        }
        
        if (data.activity === 'active') {
            total -= 0.2;
            details.push({ factor: 'Активный образ жизни', adjustment: '-0.2%' });
        }
        
        return {
            total: total,
            details: details
        };
    },
    
    // Идентификация факторов риска
    identifyRiskFactors: function(data, bmi) {
        const factors = [];
        
        if (data.age >= 65) factors.push('Возраст ≥ 65 лет');
        if (data.systolicBP >= 140) factors.push('Артериальная гипертензия (АД ≥ 140)');
        if (data.diabetes === 'yes') factors.push('Сахарный диабет');
        if (data.smoking === 'current') factors.push('Активное курение');
        if (data.afibHistory === 'yes') factors.push('Мерцательная аритмия');
        if (data.strokeHistory === 'yes') factors.push('Инсульт/ТИА в анамнезе');
        if (data.cadHistory === 'yes') factors.push('Ишемическая болезнь сердца');
        if (data.atherosclerosis === 'yes') factors.push('Атеросклероз сонных/периферических артерий');
        if (data.familyHistory === 'yes') factors.push('Семейный анамнез инсульта');
        if (bmi >= 30) factors.push('Ожирение (ИМТ ≥ 30)');
        if (data.activity === 'sedentary') factors.push('Малоподвижный образ жизни');
        if (data.cholesterol && data.cholesterol >= 5.0) factors.push('Гиперхолестеринемия');
        if (data.kidneyDisease === 'yes') factors.push('Хроническая болезнь почек');
        if (data.alcohol === 'heavy') factors.push('Злоупотребление алкоголем');
        
        return factors;
    },
    
    // Отображение результата
    displayRiskResult: function(result) {
        const resultContainer = document.getElementById('result-content');
        
        // Генерация рекомендаций
        const recommendations = this.generateRecommendations(result);
        
        // Определяем цвет для уровня риска
        let riskColor = '';
        if (result.riskLevel === 'low') riskColor = '#4CAF50';
        else if (result.riskLevel === 'moderate') riskColor = '#FFC107';
        else if (result.riskLevel === 'high') riskColor = '#FF9800';
        else riskColor = '#F44336';
        
        // Формируем детализацию по шкалам
        let scalesHTML = '';
        
        if (result.score2Risk) {
            scalesHTML += `
                <div class="score-card">
                    <h4><i class="fas fa-globe-europe"></i> SCORE2 (Россия)</h4>
                    <div class="score-value">${result.score2Risk.tenYearRisk.toFixed(1)}%</div>
                    <p>10-летний риск ССЗ</p>
                    <p class="score-category">${result.score2Risk.riskCategory} риск</p>
                </div>
            `;
        }
        
        if (result.framinghamRisk) {
            scalesHTML += `
                <div class="score-card">
                    <h4><i class="fas fa-balance-scale"></i> Шкала Фрамингема</h4>
                    <div class="score-value">${result.framinghamRisk.points} баллов</div>
                    <p>10-летний риск: ${result.framinghamRisk.tenYearRisk}%</p>
                    <p class="score-category">${result.framinghamRisk.riskCategory} риск</p>
                </div>
            `;
        }
        
        if (result.abcd2Risk) {
            scalesHTML += `
                <div class="score-card">
                    <h4><i class="fas fa-heartbeat"></i> ABCD²</h4>
                    <div class="score-value">${result.abcd2Risk.score} баллов</div>
                    <p>Риск за 90 дней: ${result.abcd2Risk.sixMonthRisk}%</p>
                    <p class="score-category">${result.abcd2Risk.riskCategory} риск</p>
                </div>
            `;
        }
        
        if (result.chads2vascRisk) {
            scalesHTML += `
                <div class="score-card">
                    <h4><i class="fas fa-stethoscope"></i> CHA₂DS₂-VASc</h4>
                    <div class="score-value">${result.chads2vascRisk.score} баллов</div>
                    <p>Годовой риск: ${result.chads2vascRisk.strokeRisk}%</p>
                    <p><strong>Антикоагулянты:</strong> ${result.chads2vascRisk.anticoagulation}</p>
                </div>
            `;
        }
        
        // Формируем список корректировок
        let adjustmentsHTML = '';
        if (result.adjustments && result.adjustments.details.length > 0) {
            adjustmentsHTML = `
                <div class="adjustments-list">
                    <h4><i class="fas fa-sliders-h"></i> Дополнительные корректировки:</h4>
                    <ul>
                        ${result.adjustments.details.map(adj => 
                            `<li>${adj.factor}: <strong style="color: ${adj.adjustment.startsWith('+') ? '#F44336' : '#4CAF50'}">${adj.adjustment}</strong></li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }
        
        let resultHTML = `
            <div class="risk-result">
                <div class="risk-header">
                    <div>
                        <h2>Результат оценки риска</h2>
                        <p class="subtitle">Прогноз на ближайшие 6 месяцев</p>
                        ${result.hasEstablishedCVD ? 
                            '<p class="badge badge-secondary">Вторичная профилактика (есть ССЗ)</p>' : 
                            '<p class="badge badge-primary">Первичная профилактика</p>'}
                    </div>
                    <div class="risk-percentage" style="color: ${riskColor}">${result.sixMonthRisk}%</div>
                </div>
                
                <div class="risk-level ${result.riskLevel}" style="background-color: ${riskColor}20; color: ${riskColor}; border: 2px solid ${riskColor}">
                    ${this.capitalizeFirstLetter(result.probability)} риск
                </div>
                
                <div class="risk-description">
                    <p>Ваш прогнозируемый риск инсульта в ближайшие 6 месяцев составляет <strong style="color: ${riskColor}">${result.sixMonthRisk}%</strong> (${result.probability} риск).</p>
                    ${result.factors.length > 0 ? 
                        `<p><strong>Основные факторы риска:</strong> ${result.factors.join(', ')}</p>` : 
                        '<p>У вас мало факторов риска, что является хорошим знаком.</p>'
                    }
                    <p><strong>Индекс массы тела (ИМТ):</strong> ${result.bmi}</p>
                </div>
                
                ${adjustmentsHTML}
                
                <div class="detailed-scores">
                    <h3><i class="fas fa-chart-bar"></i> Детализация по клиническим шкалам</h3>
                    <div class="scores-grid">
                        ${scalesHTML}
                    </div>
                </div>
                
                <div class="methodology-note" style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> 
                    <strong>Методология:</strong> Приложение использует валидированные шкалы SCORE2 (ESC 2021), Фрамингемскую шкалу, ABCD² и CHA₂DS₂-VASc. 
                    Расчёт основан на аддитивной балльной системе с корректировками.
                </div>
                
                <div class="recommendations">
                    <h3><i class="fas fa-list-check"></i> Персонализированные рекомендации</h3>
                    
                    <div class="recommendation-category">
                        <h4><i class="fas fa-heart-pulse"></i> Медицинские рекомендации</h4>
                        <ul class="recommendation-list">
                            ${recommendations.medical.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="recommendation-category">
                        <h4><i class="fas fa-walking"></i> Изменение образа жизни</h4>
                        <ul class="recommendation-list">
                            ${recommendations.lifestyle.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="recommendation-category">
                        <h4><i class="fas fa-calendar-check"></i> Мониторинг и профилактика</h4>
                        <ul class="recommendation-list">
                            ${recommendations.monitoring.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="legal-notice" style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                    <p><strong><i class="fas fa-exclamation-triangle"></i> ВАЖНО:</strong> Этот инструмент не ставит диагноз и не заменяет консультацию врача. При любых подозрительных симптомах звоните 103 или 112 немедленно!</p>
                </div>
            </div>
            
            <div class="form-actions" style="margin-top: 30px;">
                <button class="btn btn-secondary" id="recalculate-btn">
                    <i class="fas fa-redo"></i> Пересчитать с новыми данными
                </button>
                <button class="btn btn-primary" id="education-btn">
                    <i class="fas fa-graduation-cap"></i> Изучить признаки инсульта
                </button>
            </div>
        `;
        
        resultContainer.innerHTML = resultHTML;
        
        document.getElementById('recalculate-btn')?.addEventListener('click', () => {
            this.switchTab('questionnaire');
        });
        
        document.getElementById('education-btn')?.addEventListener('click', () => {
            this.switchTab('education');
        });
    },
    
    // Генерация рекомендаций
    generateRecommendations: function(result) {
        const recommendations = {
            medical: [],
            lifestyle: [],
            monitoring: []
        };
        
        const riskPercent = parseFloat(result.sixMonthRisk);
        
        // Общие рекомендации для всех
        if (result.hasEstablishedCVD) {
            recommendations.medical.push(
                'Вы находитесь в группе вторичной профилактики — необходим регулярный приём назначенных препаратов',
                'Консультация невролога/кардиолога не реже 2 раз в год'
            );
        }
        
        if (result.riskLevel === 'low') {
            recommendations.medical.push(
                'Продолжайте регулярные профилактические осмотры у терапевта 1 раз в год',
                'Контролируйте артериальное давление не реже 1 раза в месяц'
            );
            recommendations.lifestyle.push(
                'Физическая активность ≥ 150 минут умеренной нагрузки в неделю',
                'Сбалансированное питание: соль < 5 г/день, овощи и фрукты ≥ 400 г/день',
                'Поддерживайте нормальный вес: ИМТ 18.5-24.9'
            );
            recommendations.monitoring.push(
                'Диспансеризация по ОМС ежегодно',
                'Измерение АД 1 раз в месяц',
                'Контроль веса и окружности талии'
            );
        } 
        else if (result.riskLevel === 'moderate') {
            recommendations.medical.push(
                'Запишитесь на приём к терапевту в ближайшие 2-4 недели',
                'Если АД ≥ 140/90 более 3 дней подряд — срочно к врачу',
                'Рассмотрите консультацию кардиолога'
            );
            recommendations.lifestyle.push(
                'Приоритет: ежедневный контроль АД утром и вечером',
                'Если курите — начните отказ: риск снижается через 24 часа',
                'При избыточном весе: снижение на 5-10% снижает риск инсульта на 25%',
                'Ограничьте алкоголь до 1 дозы/день'
            );
            recommendations.monitoring.push(
                'Дневник АД: измерения ежедневно',
                'Контроль холестерина и глюкозы каждые 6 месяцев',
                'Обращайте внимание на симптомы: головокружение, онемение, нарушение речи'
            );
        } 
        else { // high и very-high
            recommendations.medical.push(
                'Немедленно запишитесь к терапевту или неврологу',
                'При симптомах (онемение, нарушение речи, асимметрия лица) — звоните 103/112',
                'Требуется: ЭКГ, УЗИ брахиоцефальных артерий, липидограмма, коагулограмма'
            );
            recommendations.lifestyle.push(
                'Срочный контроль АД: 2-3 раза в день',
                'Немедленный отказ от курения',
                'Снижение веса под контролем врача',
                'Полное исключение алкоголя, соль ≤ 3 г/день'
            );
            recommendations.monitoring.push(
                'Ежедневный мониторинг АД с записью',
                'Регулярный контроль липидного профиля и глюкозы',
                'Изучите признаки инсульта и ТИА',
                'Сообщите близким о вашем риске'
            );
        }
        
        return recommendations;
    },
    
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    MyRiskApp.init();
});

// Анимация для кнопок экстренного вызова
document.addEventListener('DOMContentLoaded', function() {
    const emergencyButtons = document.querySelectorAll('.emergency-btn');
    
    emergencyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            console.log(`Вызов экстренной службы: ${this.querySelector('.btn-title').textContent}`);
        });
        
        button.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                this.style.transform = 'translateY(-5px)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    let lastScrollTop = 0;
    const emergencyContainer = document.querySelector('.emergency-call-container');
    
    if (emergencyContainer) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (window.innerWidth <= 768) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    emergencyContainer.style.opacity = '0.7';
                    emergencyContainer.style.transform = 'scale(0.98)';
                } else {
                    emergencyContainer.style.opacity = '1';
                    emergencyContainer.style.transform = 'scale(1)';
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }
});
