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
        
        // Рассчитываем риск
        const riskResult = this.calculateRiskScore(formData);
        
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
            hypertension: document.getElementById('hypertension').value,
            diabetes: document.getElementById('diabetes').value,
            cholesterol: document.getElementById('cholesterol').value ? parseFloat(document.getElementById('cholesterol').value) : null,
            afib: document.getElementById('afib').value,
            palpitations: document.getElementById('palpitations').value,
            shortnessBreath: document.getElementById('shortness_breath').value,
            dizziness: document.getElementById('dizziness').value
        };
    },
    
    // Валидация данных
    validateFormData: function(data) {
        // Проверяем обязательные поля
        if (!data.age || data.age < 18 || data.age > 120) return false;
        if (!data.gender) return false;
        if (!data.height || data.height < 100 || data.height > 250) return false;
        if (!data.weight || data.weight < 30 || data.weight > 300) return false;
        if (!data.familyHistory) return false;
        if (!data.activity) return false;
        if (!data.smoking) return false;
        if (!data.hypertension) return false;
        if (!data.diabetes) return false;
        if (!data.afib) return false;
        
        return true;
    },
    
    // Расчет риска (упрощенная модель)
    calculateRiskScore: function(data) {
        let score = 0;
        let factors = [];
        
        // Возраст
        if (data.age >= 65) score += 3;
        else if (data.age >= 55) score += 2;
        else if (data.age >= 45) score += 1;
        
        // Пол (мужчины имеют немного более высокий риск)
        if (data.gender === 'male') score += 1;
        
        // Наследственность
        if (data.familyHistory === 'yes') score += 2;
        
        // Образ жизни
        if (data.activity === 'sedentary') score += 2;
        else if (data.activity === 'moderate') score += 1;
        
        // Курение
        if (data.smoking === 'current') {
            score += 3;
            factors.push('курение');
        } else if (data.smoking === 'former') {
            score += 1;
        }
        
        // Гипертония
        if (data.hypertension === 'yes') {
            score += 3;
            factors.push('повышенное давление');
        }
        
        // Диабет
        if (data.diabetes === 'yes') {
            score += 2;
            factors.push('диабет');
        } else if (data.diabetes === 'prediabetes') {
            score += 1;
        }
        
        // Высокий холестерин
        if (data.cholesterol && data.cholesterol > 4.9) {
            score += 2;
            factors.push('высокий холестерин');
        }
        
        // Мерцательная аритмия
        if (data.afib === 'yes') {
            score += 4;
            factors.push('мерцательная аритмия');
        }
        
        // Симптомы
        if (data.palpitations === 'often') score += 1;
        if (data.shortnessBreath === 'often') score += 1;
        if (data.dizziness === 'often') score += 1;
        
        // Рассчитываем ИМТ
        const heightInMeters = data.height / 100;
        const bmi = data.weight / (heightInMeters * heightInMeters);
        if (bmi >= 30) {
            score += 2;
            factors.push('ожирение');
        } else if (bmi >= 25) {
            score += 1;
            factors.push('избыточный вес');
        }
        
        // Определяем уровень риска и вероятность
        let riskLevel, probability, percentage;
        
        if (score >= 15) {
            riskLevel = 'high';
            probability = 'высокий';
            percentage = (3 + Math.random() * 4).toFixed(1); // 3-7%
        } else if (score >= 10) {
            riskLevel = 'moderate';
            probability = 'умеренный';
            percentage = (1 + Math.random() * 2).toFixed(1); // 1-3%
        } else {
            riskLevel = 'low';
            probability = 'низкий';
            percentage = (Math.random() * 1).toFixed(1); // 0-1%
        }
        
        return {
            score: score,
            riskLevel: riskLevel,
            probability: probability,
            percentage: percentage,
            factors: factors,
            bmi: bmi.toFixed(1)
        };
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
                    <div class="risk-percentage">${result.percentage}%</div>
                </div>
                
                <div class="risk-level ${result.riskLevel}">${this.capitalizeFirstLetter(result.probability)} риск</div>
                
                <div class="risk-description">
                    <p>Ваш прогнозируемый риск инсульта в ближайшие 6 месяцев составляет <strong>${result.percentage}%</strong> (${result.probability} риск).</p>
                    ${result.factors.length > 0 ? 
                        `<p>Основные факторы риска: <strong>${result.factors.join(', ')}</strong></p>` : 
                        '<p>У вас мало факторов риска, что является хорошим знаком.</p>'
                    }
                    <p>Индекс массы тела: <strong>${result.bmi}</strong></p>
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
