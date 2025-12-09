// Основной объект приложения
const MyRiskApp = {
    minAge: 15,
    
    // Инициализация приложения
    init: function() {
        this.setupEventListeners();
        this.calculateBMI(); // Рассчитать ИМТ сразу
        this.updateProgress(); // Обновить прогресс
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
        
        // Закрытие модального окна по клику вне его
        document.getElementById('emergency-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'emergency-modal') {
                e.target.classList.remove('active');
            }
        });
    },
    
    // Переключение между вкладками
    switchTab: function(tabName) {
        // Скрыть все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Показать выбранную вкладку
        document.getElementById(tabName).classList.add('active');
        
        // Обновить активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Прокрутить к верху
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
        // Собираем данные из формы
        const formData = this.collectFormData();
        
        // Валидация
        const validation = this.validateFormData(formData);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }
        
        // Рассчитываем риск по всем шкалам
        const riskResult = this.calculateHybridRisk(formData);
        
        // Отображаем результат
        this.displayRiskResult(riskResult);
        
        // Переключаемся на вкладку с результатом
        this.switchTab('result');
        
        // Если риск высокий - показываем модальное окно
        if (riskResult.riskLevel === 'high' && parseFloat(riskResult.sixMonthRisk) >= 3) {
            setTimeout(() => {
                document.getElementById('emergency-modal').classList.add('active');
            }, 1000);
        }
    },
    
    // Сбор данных из формы
    collectFormData: function() {
        return {
            age: parseInt(document.getElementById('age').value) || 0,
            gender: document.getElementById('gender').value || '',
            height: parseFloat(document.getElementById('height').value) || 0,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            familyHistory: document.getElementById('family_history').value || '',
            activity: document.getElementById('activity').value || '',
            smoking: document.getElementById('smoking').value || '',
            systolicBP: parseInt(document.getElementById('systolic_bp').value) || 0,
            bpMedication: document.getElementById('bp_medication').value || '',
            diabetes: document.getElementById('diabetes').value || '',
            cholesterol: document.getElementById('cholesterol').value ? 
                parseFloat(document.getElementById('cholesterol').value) : null,
            afibHistory: document.getElementById('afib_history').value || '',
            strokeHistory: document.getElementById('stroke_history').value || '',
            palpitations: document.getElementById('palpitations').value || '',
            shortnessBreath: document.getElementById('shortness_breath').value || '',
            dizziness: document.getElementById('dizziness').value || ''
        };
    },
    
    // Валидация данных
    validateFormData: function(data) {
        // Проверяем возраст
        if (!data.age || data.age < this.minAge || data.age > 120) {
            return {
                valid: false,
                message: `Пожалуйста, введите корректный возраст (от ${this.minAge} до 120 лет)`
            };
        }
        
        // Проверяем другие обязательные поля
        const requiredFields = [
            { field: data.gender, name: 'Пол' },
            { field: data.height, name: 'Рост', min: 100, max: 250 },
            { field: data.weight, name: 'Вес', min: 30, max: 300 },
            { field: data.familyHistory, name: 'Наследственность' },
            { field: data.activity, name: 'Физическая активность' },
            { field: data.smoking, name: 'Курение' },
            { field: data.systolicBP, name: 'Артериальное давление', min: 80, max: 250 },
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
            
            if (field.min && field.max) {
                if (field.field < field.min || field.field > field.max) {
                    return {
                        valid: false,
                        message: `Пожалуйста, введите корректное значение для "${field.name}" (от ${field.min} до ${field.max})`
                    };
                }
            }
        }
        
        return { valid: true, message: '' };
    },
    
    // Гибридный расчет риска на основе нескольких шкал
    calculateHybridRisk: function(data) {
        // Рассчитываем ИМТ
        const heightInMeters = data.height / 100;
        const bmi = data.weight / (heightInMeters * heightInMeters);
        
        // Рассчитываем все компоненты
        const framinghamRisk = this.calculateFraminghamRisk(data);
        const abcd2Risk = this.calculateABCD2Risk(data);
        const chads2vascRisk = this.calculateCHADS2VAScRisk(data);
        
        // Определяем факторы риска
        const factors = this.identifyRiskFactors(data, bmi);
        
        // Комбинируем риски для 6-месячного прогноза
        let sixMonthRisk = 0;
        
        // Базовый риск из Фрамингемской шкалы (адаптированный для 6 месяцев)
        // Исходный 10-летний риск делим на 20 для грубой оценки 6-месячного
        const framinghamSixMonth = framinghamRisk.tenYearRisk / 20;
        
        // Добавляем риск от ABCD², если есть история ТИА
        if (data.strokeHistory === 'yes') {
            sixMonthRisk += abcd2Risk.sixMonthRisk;
        }
        
        // Добавляем риск от CHA₂DS₂-VASc, если есть мерцательная аритмия
        if (data.afibHistory === 'yes') {
            sixMonthRisk += chads2vascRisk.sixMonthRisk;
        }
        
        // Добавляем базовый риск
        sixMonthRisk += framinghamSixMonth;
        
        // Корректировка на основе данных INTERSTROKE
        sixMonthRisk = this.applyINTERSTROKECorrections(data, sixMonthRisk, bmi);
        
        // Ограничиваем риск разумными значениями (максимум 20%)
        sixMonthRisk = Math.min(sixMonthRisk, 20);
        
        // Определяем уровень риска
        let riskLevel, probability;
        if (sixMonthRisk < 1) {
            riskLevel = 'low';
            probability = 'низкий';
        } else if (sixMonthRisk <= 3) {
            riskLevel = 'moderate';
            probability = 'умеренный';
        } else {
            riskLevel = 'high';
            probability = 'высокий';
        }
        
        return {
            sixMonthRisk: sixMonthRisk.toFixed(2),
            riskLevel: riskLevel,
            probability: probability,
            factors: factors,
            bmi: bmi.toFixed(1),
            framinghamScore: framinghamRisk.points,
            abcd2Score: abcd2Risk.score,
            chads2vascScore: chads2vascRisk.score,
            detailedRisks: {
                framingham: framinghamRisk,
                abcd2: abcd2Risk,
                chads2vasc: chads2vascRisk
            }
        };
    },
    
    // Расчет риска по шкале Фрамингема (адаптированная версия)
    calculateFraminghamRisk: function(data) {
        let points = 0;
        
        // Возраст (основной фактор)
        if (data.age < 45) points += 0;
        else if (data.age < 55) points += 2;
        else if (data.age < 65) points += 4;
        else if (data.age < 75) points += 6;
        else points += 8;
        
        // Пол (женщины имеют немного больший риск)
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
        if (data.diabetes === 'yes') points += 3;
        else if (data.diabetes === 'prediabetes') points += 1;
        
        // Мерцательная аритмия
        if (data.afibHistory === 'yes') points += 6;
        
        // Предыдущий инсульт/ТИА
        if (data.strokeHistory === 'yes') points += 8;
        
        // Семейный анамнез
        if (data.familyHistory === 'yes') points += 2;
        
        // Рассчитываем 10-летний риск в процентах на основе баллов
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
        if (data.systolicBP >= 140) score += 1;
        
        // Клинические особенности (через симптомы)
        if (data.dizziness === 'often' || data.shortnessBreath === 'often') score += 2;
        else if (data.dizziness === 'rarely' || data.shortnessBreath === 'rarely') score += 1;
        
        // Длительность симптомов (упрощенно)
        if (data.strokeHistory === 'yes') score += 2;
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Расчет риска на 90 дней (приблизительный 6-месячный)
        let twoDayRisk = 0;
        let sevenDayRisk = 0;
        let sixMonthRisk = 0;
        
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
        
        // Сердечная недостаточность (упрощенно)
        if (data.shortnessBreath === 'often') score += 1;
        
        // Артериальная гипертензия
        if (data.systolicBP >= 140 || data.bpMedication === 'yes') score += 1;
        
        // Возраст ≥75 лет
        if (data.age >= 75) score += 2;
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Инсульт/ТИА в анамнезе
        if (data.strokeHistory === 'yes') score += 2;
        
        // Сосудистые заболевания (упрощенно)
        if (data.age >= 65 || data.smoking === 'current') score += 1;
        
        // Пол (женский)
        if (data.gender === 'female') score += 1;
        
        // Возраст 65-74 года
        if (data.age >= 65 && data.age <= 74) score += 1;
        
        // Расчет годового риска инсульта
        let strokeRisk = 0;
        const riskMap = {
            0: 0.0,  1: 1.3,  2: 2.2,  3: 3.2,
            4: 4.0,  5: 6.7,  6: 9.8,  7: 9.6,
            8: 12.5, 9: 15.2
        };
        
        strokeRisk = riskMap[Math.min(score, 9)] || 15.2;
        
        // Пересчет на 6 месяцев (грубая оценка)
        const sixMonthRisk = strokeRisk / 2;
        
        // Рекомендация по антикоагулянтам
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
    
    // Коррекция риска на основе данных INTERSTROKE
    applyINTERSTROKECorrections: function(data, baseRisk, bmi) {
        let correctedRisk = baseRisk;
        
        // Гипертония - основной фактор
        if (data.systolicBP >= 140) correctedRisk *= 1.5;
        else if (data.systolicBP >= 130) correctedRisk *= 1.3;
        
        // Низкая физическая активность
        if (data.activity === 'sedentary') correctedRisk *= 1.4;
        else if (data.activity === 'moderate') correctedRisk *= 1.2;
        
        // Высокий холестерин
        if (data.cholesterol && data.cholesterol >= 4.9) correctedRisk *= 1.3;
        
        // Ожирение
        if (bmi >= 30) correctedRisk *= 1.4;
        else if (bmi >= 25) correctedRisk *= 1.2;
        
        // Курение
        if (data.smoking === 'current') correctedRisk *= 2.0;
        else if (data.smoking === 'former') correctedRisk *= 1.2;
        
        // Диабет
        if (data.diabetes === 'yes') correctedRisk *= 1.8;
        else if (data.diabetes === 'prediabetes') correctedRisk *= 1.3;
        
        return correctedRisk;
    },
    
    // Идентификация факторов риска
    identifyRiskFactors: function(data, bmi) {
        const factors = [];
        
        if (data.age >= 65) factors.push('Возраст ≥65 лет');
        if (data.systolicBP >= 140) factors.push('Артериальная гипертензия');
        if (data.diabetes === 'yes') factors.push('Сахарный диабет');
        if (data.smoking === 'current') factors.push('Курение');
        if (data.afibHistory === 'yes') factors.push('Мерцательная аритмия');
        if (data.strokeHistory === 'yes') factors.push('Инсульт/ТИА в анамнезе');
        if (data.familyHistory === 'yes') factors.push('Наследственность');
        if (bmi >= 30) factors.push('Ожирение (ИМТ ≥30)');
        else if (bmi >= 25) factors.push('Избыточный вес (ИМТ 25-29.9)');
        if (data.activity === 'sedentary') factors.push('Малоподвижный образ жизни');
        if (data.cholesterol && data.cholesterol >= 4.9) factors.push('Высокий холестерин (≥4.9 ммоль/л)');
        
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
        else riskColor = '#F44336';
        
        // HTML для результата
        let resultHTML = `
            <div class="risk-result">
                <div class="risk-header">
                    <div>
                        <h2>Результат оценки риска</h2>
                        <p class="subtitle">Прогноз на ближайшие 6 месяцев</p>
                    </div>
                    <div class="risk-percentage" style="color: ${riskColor}">${result.sixMonthRisk}%</div>
                </div>
                
                <div class="risk-level ${result.riskLevel}" style="background-color: ${riskColor}20; color: ${riskColor}">
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
                
                <div class="detailed-scores">
                    <h3><i class="fas fa-chart-bar"></i> Детализация по клиническим шкалам</h3>
                    
                    <div class="scores-grid">
                        <div class="score-card">
                            <h4><i class="fas fa-balance-scale"></i> Шкала Фрамингема</h4>
                            <div class="score-value">${result.framinghamScore}</div>
                            <p>10-летний риск: ${result.detailedRisks.framingham.tenYearRisk}%</p>
                            <p class="score-category">${result.detailedRisks.framingham.riskCategory} риск</p>
                        </div>
                        
                        <div class="score-card">
                            <h4><i class="fas fa-heartbeat"></i> ABCD²</h4>
                            <div class="score-value">${result.abcd2Score}</div>
                            <p>Риск за 90 дней: ${result.detailedRisks.abcd2.sixMonthRisk}%</p>
                            <p class="score-category">${result.detailedRisks.abcd2.riskCategory} риск</p>
                        </div>
                        
                        <div class="score-card">
                            <h4><i class="fas fa-stethoscope"></i> CHA₂DS₂-VASc</h4>
                            <div class="score-value">${result.chads2vascScore}</div>
                            <p>Годовой риск: ${result.detailedRisks.chads2vasc.strokeRisk}%</p>
                            <p><strong>Антикоагулянты:</strong> ${result.detailedRisks.chads2vasc.anticoagulation}</p>
                        </div>
                    </div>
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
        
        // Добавляем обработчики для новых кнопок
        document.getElementById('recalculate-btn')?.addEventListener('click', () => {
            this.switchTab('questionnaire');
        });
        
        document.getElementById('education-btn')?.addEventListener('click', () => {
            this.switchTab('education');
        });
    },
    
    // Генерация рекомендаций на основе уровня риска
    generateRecommendations: function(result) {
        const recommendations = {
            medical: [],
            lifestyle: [],
            monitoring: []
        };
        
        const riskPercent = parseFloat(result.sixMonthRisk);
        
        if (result.riskLevel === 'low') {
            recommendations.medical.push(
                'Продолжайте регулярные профилактические осмотры у терапевта 1 раз в год',
                'Контролируйте артериальное давление не реже 1 раза в месяц'
            );
            
            recommendations.lifestyle.push(
                'Поддерживайте здоровый образ жизни: физическая активность ≥150 минут в неделю',
                'Сбалансированное питание: сократите соль (<5 г/день), добавьте овощи и фрукты (≥400 г/день)',
                'Поддерживайте нормальный вес: ИМТ 18.5-24.9'
            );
            
            recommendations.monitoring.push(
                'Проходите диспансеризацию по полису ОМС ежегодно',
                'Измеряйте артериальное давление 1 раз в месяц',
                'Контролируйте вес и окружность талии (мужчины <94 см, женщины <80 см)'
            );
        } 
        else if (result.riskLevel === 'moderate') {
            recommendations.medical.push(
                'Запишитесь на прием к терапевту в ближайшие 2-4 недели',
                'Если артериальное давление ≥140/90 более 3 дней подряд — обратитесь к врачу как можно скорее',
                'Рассмотрите возможность консультации кардиолога или невролога'
            );
            
            recommendations.lifestyle.push(
                'Приоритет №1 — контроль артериального давления: измеряйте его ежедневно утром и вечером',
                'Если курите — начните отказ сейчас: риск снижается уже через 24 часа',
                'При избыточном весе: снижение веса на 5-10% снижает риск инсульта на 25%',
                'Исключите или максимально ограничьте употребление алкоголя'
            );
            
            recommendations.monitoring.push(
                'Измеряйте артериальное давление ежедневно, ведите дневник измерений',
                'Контролируйте уровень холестерина и сахара в крови каждые 6 месяцев',
                'Обращайте внимание на любые новые симптомы: головокружение, онемение, нарушение речи'
            );
        } 
        else { // high risk
            recommendations.medical.push(
                'Немедленно запишитесь на прием к терапевту или неврологу',
                'При наличии симптомов (онемение, нарушение речи, головокружение) — вызовите скорую помощь (103 или 112)',
                'Требуется комплексное обследование: ЭКГ, УЗИ сосудов шеи, анализ крови на липидный профиль'
            );
            
            recommendations.lifestyle.push(
                'Срочно начните контроль артериального давления: измеряйте 2-3 раза в день',
                'Немедленно откажитесь от курения — это критически важно',
                'Начните программу снижения веса под контролем врача',
                'Полностью исключите алкоголь и сократите потребление соли до 3 г/день'
            );
            
            recommendations.monitoring.push(
                'Ежедневный мониторинг артериального давления с записью результатов',
                'Регулярный контроль уровня холестерина и сахара в крови',
                'Изучите признаки инсульта и ТИА (транзиторной ишемической атаки)',
                'Сообщите близким о вашем риске и симптомах, на которые нужно обращать внимание'
            );
        }
        
        return recommendations;
    },
    
    // Вспомогательная функция для капитализации строки
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    MyRiskApp.init();
});
// Анимация для кнопок экстренного вызова
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем вибрацию при клике на кнопки экстренного вызова (если поддерживается)
    const emergencyButtons = document.querySelectorAll('.emergency-btn');
    
    emergencyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Проверяем, поддерживает ли устройство вибрацию
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            // Добавляем визуальную обратную связь
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Логируем вызов
            console.log(`Вызов экстренной службы: ${this.querySelector('.btn-title').textContent}`);
        });
        
        // Анимация при наведении для десктопов
        button.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) { // Только для десктопов
                this.style.transform = 'translateY(-5px)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Показать/скрыть кнопки экстренного вызова при скролле
    let lastScrollTop = 0;
    const emergencyContainer = document.querySelector('.emergency-call-container');
    
    if (emergencyContainer) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // На мобильных устройствах скрываем при скролле вниз, показываем при скролле вверх
            if (window.innerWidth <= 768) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Скролл вниз
                    emergencyContainer.style.opacity = '0.7';
                    emergencyContainer.style.transform = 'scale(0.98)';
                } else {
                    // Скролл вверх
                    emergencyContainer.style.opacity = '1';
                    emergencyContainer.style.transform = 'scale(1)';
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }
});
