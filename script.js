```javascript
// Основной объект приложения
const MyRiskApp = {
    // Инициализация приложения
    init: function() {
        this.setupEventListeners();
        this.calculateBMI();
        this.updateProgress();
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
        const height = parseFloat(document.getElementById('height')?.value);
        const weight = parseFloat(document.getElementById('weight')?.value);
        
        if (height && weight && height > 0 && weight > 0) {
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const bmiRounded = bmi.toFixed(1);
            
            let bmiCategory = '';
            if (bmi < 18.5) bmiCategory = ' (Недостаточный вес)';
            else if (bmi < 25) bmiCategory = ' (Нормальный вес)';
            else if (bmi < 30) bmiCategory = ' (Избыточный вес)';
            else bmiCategory = ' (Ожирение)';
            
            document.getElementById('bmi-result').textContent = `${bmiRounded}${bmiCategory}`;
        } else {
            document.getElementById('bmi-result').textContent = '—';
        }
    },
    
    // Обновление прогресса заполнения формы
    updateProgress: function() {
        const form = document.getElementById('risk-form');
        if (!form) return;
        
        const requiredFields = form.querySelectorAll('[required]');
        let filledCount = 0;
        
        requiredFields.forEach(field => {
            if (field.type === 'number' && field.value !== '') {
                filledCount++;
            } else if (field.type === 'select-one' && field.value !== '') {
                filledCount++;
            }
        });
        
        const progress = (filledCount / requiredFields.length) * 100;
        const progressBar = document.querySelector('.progress-bar');
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
        if (!this.validateFormData(formData)) {
            alert('Пожалуйста, заполните все обязательные поля корректно.');
            return;
        }
        
        // Рассчитываем риск по всем шкалам
        const riskResult = this.calculateHybridRisk(formData);
        
        // Отображаем результат
        this.displayRiskResult(riskResult);
        
        // Переключаемся на вкладку с результатом
        this.switchTab('result');
        
        // Если риск высокий - показываем модальное окно
        if (riskResult.riskLevel === 'high') {
            setTimeout(() => {
                document.getElementById('emergency-modal').classList.add('active');
            }, 1000);
        }
    },
    
    // Сбор данных из формы
    collectFormData: function() {
        return {
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            familyHistory: document.getElementById('family_history').value,
            activity: document.getElementById('activity').value,
            smoking: document.getElementById('smoking').value,
            systolicBP: parseInt(document.getElementById('systolic_bp').value),
            bpMedication: document.getElementById('bp_medication').value,
            diabetes: document.getElementById('diabetes').value,
            cholesterol: document.getElementById('cholesterol').value ? parseFloat(document.getElementById('cholesterol').value) : null,
            afibHistory: document.getElementById('afib_history').value,
            strokeHistory: document.getElementById('stroke_history').value,
            palpitations: document.getElementById('palpitations').value,
            shortnessBreath: document.getElementById('shortness_breath').value,
            dizziness: document.getElementById('dizziness').value
        };
    },
    
    // Валидация данных
    validateFormData: function(data) {
        // Проверяем обязательные поля
        if (!data.age || data.age < 35 || data.age > 120) return false;
        if (!data.gender) return false;
        if (!data.height || data.height < 100 || data.height > 250) return false;
        if (!data.weight || data.weight < 30 || data.weight > 300) return false;
        if (!data.familyHistory) return false;
        if (!data.activity) return false;
        if (!data.smoking) return false;
        if (!data.systolicBP || data.systolicBP < 80 || data.systolicBP > 250) return false;
        if (!data.bpMedication) return false;
        if (!data.diabetes) return false;
        if (!data.afibHistory) return false;
        if (!data.strokeHistory) return false;
        
        return true;
    },
    
    // Гибридный расчет риска на основе нескольких шкал
    calculateHybridRisk: function(data) {
        // Рассчитываем все компоненты
        const framinghamRisk = this.calculateFraminghamRisk(data);
        const abcd2Risk = this.calculateABCD2Risk(data);
        const chads2vascRisk = this.calculateCHADS2VAScRisk(data);
        
        // Рассчитываем ИМТ
        const heightInMeters = data.height / 100;
        const bmi = data.weight / (heightInMeters * heightInMeters);
        
        // Определяем факторы риска
        const factors = this.identifyRiskFactors(data, bmi);
        
        // Комбинируем риски для 6-месячного прогноза
        let sixMonthRisk = 0;
        
        // Базовый риск из Фрамингемской шкалы (пересчет с 10 лет на 6 месяцев)
        const framinghamSixMonth = framinghamRisk.tenYearRisk * 0.05; // Упрощенный пересчет
        
        // Добавляем риск от ABCD², если есть история ТИА
        if (data.strokeHistory === 'yes') {
            sixMonthRisk += abcd2Risk.sixMonthRisk * 2; // Увеличиваем вес при наличии ТИА
        }
        
        // Добавляем риск от CHA₂DS₂-VASc, если есть мерцательная аритмия
        if (data.afibHistory === 'yes') {
            sixMonthRisk += chads2vascRisk.strokeRisk * 1.5;
        }
        
        // Добавляем базовый риск
        sixMonthRisk += framinghamSixMonth;
        
        // Корректировка на основе данных INTERSTROKE
        sixMonthRisk = this.applyINTERSTROKECorrections(data, sixMonthRisk, bmi);
        
        // Ограничиваем риск максимальным значением 15%
        sixMonthRisk = Math.min(sixMonthRisk, 15);
        
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
            sixMonthRisk: sixMonthRisk.toFixed(1),
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
    
    // Расчет риска по шкале Фрамингема
    calculateFraminghamRisk: function(data) {
        let points = 0;
        
        // Возраст
        if (data.gender === 'male') {
            if (data.age >= 75) points += 10;
            else if (data.age >= 65) points += 7;
            else if (data.age >= 55) points += 4;
            else if (data.age >= 45) points += 2;
        } else { // female
            if (data.age >= 75) points += 12;
            else if (data.age >= 65) points += 9;
            else if (data.age >= 55) points += 6;
            else if (data.age >= 45) points += 3;
        }
        
        // Систолическое давление
        if (data.bpMedication === 'yes') {
            if (data.systolicBP >= 160) points += 5;
            else if (data.systolicBP >= 140) points += 4;
            else if (data.systolicBP >= 130) points += 3;
            else if (data.systolicBP >= 120) points += 2;
        } else {
            if (data.systolicBP >= 160) points += 3;
            else if (data.systolicBP >= 140) points += 2;
            else if (data.systolicBP >= 130) points += 1;
        }
        
        // Курение
        if (data.smoking === 'current') points += 3;
        else if (data.smoking === 'former') points += 1;
        
        // Диабет
        if (data.diabetes === 'yes') points += 3;
        else if (data.diabetes === 'prediabetes') points += 1;
        
        // Мерцательная аритмия
        if (data.afibHistory === 'yes') points += 6;
        
        // Заболевания сердца (упрощенно через симптомы)
        if (data.palpitations === 'often' || data.shortnessBreath === 'often') points += 1;
        
        // Рассчитываем 10-летний риск в процентах на основе баллов
        let tenYearRisk = 0;
        if (points <= 5) tenYearRisk = 1;
        else if (points <= 10) tenYearRisk = 3;
        else if (points <= 15) tenYearRisk = 8;
        else if (points <= 20) tenYearRisk = 15;
        else if (points <= 25) tenYearRisk = 25;
        else tenYearRisk = 35;
        
        return {
            points: points,
            tenYearRisk: tenYearRisk,
            riskCategory: points <= 10 ? 'низкий' : points <= 20 ? 'умеренный' : 'высокий'
        };
    },
    
    // Расчет риска по шкале ABCD²
    calculateABCD2Risk: function(data) {
        let score = 0;
        
        // Возраст > 60 лет
        if (data.age > 60) score += 1;
        
        // Артериальное давление ≥140/90 мм рт.ст.
        if (data.systolicBP >= 140) score += 1;
        
        // Клинические особенности (упрощенно через симптомы)
        if (data.dizziness === 'often' || data.palpitations === 'often') score += 2;
        else if (data.dizziness === 'rarely' || data.palpitations === 'rarely') score += 1;
        
        // Длительность симптомов (упрощенно)
        if (data.strokeHistory === 'yes') score += 2; // Предполагаем, что симптомы были продолжительными
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Расчет риска на 2, 7 и 90 дней
        let twoDayRisk = 0;
        let sevenDayRisk = 0;
        let sixMonthRisk = 0;
        
        if (score <= 3) {
            twoDayRisk = 1.0;
            sevenDayRisk = 1.2;
            sixMonthRisk = 3.1;
        } else if (score <= 5) {
            twoDayRisk = 4.1;
            sevenDayRisk = 5.9;
            sixMonthRisk = 9.8;
        } else {
            twoDayRisk = 8.1;
            sevenDayRisk = 11.7;
            sixMonthRisk = 17.8;
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
        
        // Сердечная недостаточность (упрощенно через симптомы)
        if (data.shortnessBreath === 'often') score += 1;
        
        // Артериальная гипертензия
        if (data.systolicBP >= 140 || data.bpMedication === 'yes') score += 1;
        
        // Возраст ≥75 лет
        if (data.age >= 75) score += 2;
        
        // Сахарный диабет
        if (data.diabetes === 'yes') score += 1;
        
        // Инсульт/ТИА в анамнезе
        if (data.strokeHistory === 'yes') score += 2;
        
        // Сосудистые заболевания (упрощенно через возраст и курение)
        if (data.age >= 65 || data.smoking === 'current') score += 1;
        
        // Пол (женский)
        if (data.gender === 'female') score += 1;
        
        // Возраст 65-74 года
        if (data.age >= 65 && data.age <= 74) score += 1;
        
        // Расчет годового риска инсульта
        let strokeRisk = 0;
        if (score === 0) strokeRisk = 0.0;
        else if (score === 1) strokeRisk = 1.3;
        else if (score === 2) strokeRisk = 2.2;
        else if (score === 3) strokeRisk = 3.2;
        else if (score === 4) strokeRisk = 4.0;
        else if (score === 5) strokeRisk = 6.7;
        else if (score === 6) strokeRisk = 9.8;
        else if (score === 7) strokeRisk = 9.6;
        else if (score === 8) strokeRisk = 12.5;
        else if (score === 9) strokeRisk = 15.2;
        
        // Пересчет на 6 месяцев
        const sixMonthRisk = strokeRisk / 2;
        
        return {
            score: score,
            strokeRisk: strokeRisk,
            sixMonthRisk: sixMonthRisk,
            anticoagulation: score >= 2 ? 'показаны' : score === 1 ? 'рассмотреть' : 'не показаны'
        };
    },
    
    // Коррекция риска на основе данных INTERSTROKE
    applyINTERSTROKECorrections: function(data, baseRisk, bmi) {
        let correctedRisk = baseRisk;
        
        // Гипертония - самый значимый фактор
        if (data.systolicBP >= 140) correctedRisk *= 1.5;
        else if (data.systolicBP >= 130) correctedRisk *= 1.3;
        
        // Низкая физическая активность
        if (data.activity === 'sedentary') correctedRisk *= 1.4;
        else if (data.activity === 'moderate') correctedRisk *= 1.2;
        
        // Дислипидемия (высокий холестерин)
        if (data.cholesterol && data.cholesterol >= 4.9) correctedRisk *= 1.3;
        
        // Ожирение
        if (bmi >= 30) correctedRisk *= 1.4;
        else if (bmi >= 25) correctedRisk *= 1.2;
        
        // Курение
        if (data.smoking === 'current') correctedRisk *= 2.0;
        else if (data.smoking === 'former') correctedRisk *= 1.2;
        
        return correctedRisk;
    },
    
    // Идентификация факторов риска
    identifyRiskFactors: function(data, bmi) {
        const factors = [];
        
        if (data.age >= 65) factors.push('возраст ≥65 лет');
        if (data.systolicBP >= 140) factors.push('артериальная гипертензия');
        if (data.diabetes === 'yes') factors.push('сахарный диабет');
        if (data.smoking === 'current') factors.push('курение');
        if (data.afibHistory === 'yes') factors.push('мерцательная аритмия');
        if (data.strokeHistory === 'yes') factors.push('инсульт/ТИА в анамнезе');
        if (data.familyHistory === 'yes') factors.push('наследственность');
        if (bmi >= 30) factors.push('ожирение');
        else if (bmi >= 25) factors.push('избыточный вес');
        if (data.activity === 'sedentary') factors.push('малоподвижный образ жизни');
        if (data.cholesterol && data.cholesterol >= 4.9) factors.push('высокий холестерин');
        
        return factors;
    },
    
    // Отображение результата
    displayRiskResult: function(result) {
        const resultContainer = document.getElementById('result-content');
        
        // Генерация рекомендаций
        const recommendations = this.generateRecommendations(result);
        
        // HTML для результата
        let resultHTML = `
            <div class="risk-result ${result.riskLevel}">
                <div class="risk-header">
                    <div>
                        <h2>Результат оценки риска</h2>
                        <p class="subtitle">Прогноз на ближайшие 6 месяцев</p>
                    </div>
                    <div class="risk-percentage">${result.sixMonthRisk}%</div>
                </div>
                
                <div class="risk-level ${result.riskLevel}">${this.capitalizeFirstLetter(result.probability)} риск</div>
                
                <div class="risk-description">
                    <p>Ваш прогнозируемый риск инсульта в ближайшие 6 месяцев составляет <strong>${result.sixMonthRisk}%</strong> (${result.probability} риск).</p>
                    ${result.factors.length > 0 ? 
                        `<p>Основные факторы риска: <strong>${result.factors.join(', ')}</strong></p>` : 
                        '<p>У вас мало факторов риска, что является хорошим знаком.</p>'
                    }
                    <p>Индекс массы тела: <strong>${result.bmi}</strong></p>
                </div>
                
                <div class="detailed-scores">
                    <h3><i class="fas fa-chart-bar"></i> Детализация по шкалам</h3>
                    
                    <div class="scores-grid">
                        <div class="score-card">
                            <h4>Шкала Фрамингема</h4>
                            <div class="score-value">${result.framinghamScore} баллов</div>
                            <p>10-летний риск: ${result.detailedRisks.framingham.tenYearRisk}%</p>
                            <p class="score-category">${result.detailedRisks.framingham.riskCategory} риск</p>
                        </div>
                        
                        <div class="score-card">
                            <h4>ABCD²</h4>
                            <div class="score-value">${result.abcd2Score} баллов</div>
                            <p>Риск за 90 дней: ${result.detailedRisks.abcd2.sixMonthRisk}%</p>
                            <p class="score-category">${result.detailedRisks.abcd2.riskCategory} риск</p>
                        </div>
                        
                        <div class="score-card">
                            <h4>CHA₂DS₂-VASc</h4>
                            <div class="score-value">${result.chads2vascScore} баллов</div>
                            <p>Годовой риск: ${result.detailedRisks.chads2vasc.strokeRisk}%</p>
                            <p>Антикоагулянты: ${result.detailedRisks.chads2vasc.anticoagulation}</p>
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
                
                <div class="legal-notice" style="margin-top: 30px;">
                    <p><strong>ВАЖНО:</strong> Этот инструмент не ставит диагноз и не заменяет консультацию врача. При любых подозрительных симптомах звоните 103 или 112 немедленно!</p>
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
        
        if (result.riskLevel === 'low') {
            recommendations.medical.push(
                'Продолжайте регулярные профилактические осмотры у терапевта (1 раз в год)',
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
                '<strong>Немедленно запишитесь на прием к терапевту или неврологу</strong>',
                'При наличии симптомов (онемение, нарушение речи, головокружение) — вызовите скорую помощь (103 или 112)',
                'Требуется комплексное обследование: ЭКГ, УЗИ сосудов шеи, анализ крови на липидный профиль'
            );
            
            recommendations.lifestyle.push(
                '<strong>Срочно начните контроль артериального давления:</strong> измеряйте 2-3 раза в день',
                '<strong>Немедленно откажитесь от курения</strong> — это критически важно',
                'Начните программу снижения веса под контролем врача',
                'Полностью исключите алкоголь и сократите потребление соли до 3 г/день'
            );
            
            recommendations.monitoring.push(
                '<strong>Ежедневный мониторинг артериального давления с записью результатов</strong>',
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
```
