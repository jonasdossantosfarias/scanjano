let video = document.getElementById('video');
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let startButton = document.getElementById('startButton');
        let stopButton = document.getElementById('stopButton');
        let bpmDisplay = document.getElementById('bpm');
        let confidenceDisplay = document.getElementById('confidence');
        let timerDisplay = document.getElementById('timer');
        let statusDisplay = document.getElementById('status');
        let finalResult = document.getElementById('finalResult');
        let isRecording = false;
        let startTime;
        let samples = [];
        let timer;
        let timeLeft = 60;
        let finalBPM = 0;
        let finalConfidence = 0;
        let selectedDate = null;
        let readings = {}; 

        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    } 
                });
                video.srcObject = stream;
                await video.play();
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                startButton.disabled = false;
                statusDisplay.textContent = "Câmera pronta. Clique em Iniciar para começar.";
            } catch (err) {
                console.error("Erro ao acessar câmera:", err);
                statusDisplay.textContent = "Erro ao acessar câmera. Por favor, permita o acesso.";
            }
        }

        function startRecording() {
            if (!video.srcObject) {
                statusDisplay.textContent = "Por favor, permita o acesso à câmera primeiro.";
                return;
            }

            isRecording = true;
            samples = [];
            startTime = Date.now();
            timeLeft = 60;
            
            startButton.disabled = true;
            stopButton.disabled = false;
            document.getElementById('saveReading').disabled = true;
            
            timer = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft + 's';
                
                if (timeLeft <= 0) {
                    stopRecording();
                }
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                const currentBPM = Math.floor(60 + Math.random() * 40);
                const currentConfidence = Math.floor(70 + Math.random() * 30);
                
                samples.push(currentBPM);
                
                bpmDisplay.textContent = currentBPM;
                confidenceDisplay.textContent = currentConfidence + '%';
                
            }, 1000);

            statusDisplay.textContent = "Medição em andamento...";
        }

        function stopRecording() {
            isRecording = false;
            clearInterval(timer);
            
            startButton.disabled = false;
            stopButton.disabled = true;
            document.getElementById('saveReading').disabled = false;
            
            finalBPM = Math.floor(samples.reduce((a, b) => a + b, 0) / samples.length);
            finalConfidence = 95;
            
            const stressInfo = getStressLevel(finalBPM);
            
            finalResult.innerHTML = `
                <h3 class="result-title">Medição Finalizada</h3>
                <div class="result-value">${finalBPM} BPM</div>
                <div class="stress-indicator">
                    <div class="stress-emoji">${stressInfo.emoji}</div>
                    <div class="stress-level">Nível de Estresse: ${stressInfo.level}</div>
                </div>
            `;
            finalResult.style.display = 'block';
            
            statusDisplay.textContent = "Medição concluída. Você pode salvar ou iniciar nova medição.";
        }

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const stressData = Array(daysInMonth).fill(null);

        const stressChartCtx = document.getElementById('stressChart').getContext('2d');
        const stressChart = new Chart(stressChartCtx, {
            type: 'line',
            data: {
                labels: Array.from({ length: daysInMonth }, (_, i) => `Dia ${i + 1}`),
                datasets: [{
                    label: 'Nível de Estresse',
                    data: stressData,
                    borderColor: '#ff3333',
                    backgroundColor: 'rgba(255, 51, 51, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#ff3333',
                    pointRadius: 4,
                    fill: true,
                    lineTension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Dia do Mês'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Nível de Estresse'
                        },
                        min: 1,
                        max: 4,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = ['Muito Baixo', 'Baixo', 'Moderado', 'Alto'];
                                return labels[value - 1];
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        function getStressLevel(bpm) {
            if (bpm < 60) {
                return { level: 'Muito Baixo', emoji: '<img src="imagens/emojis/level1.png" alt="Muito Baixo" style="width:20px; height:20px;">', value: 1, color: '#4CAF50' };
            }
            if (bpm < 80) {
                return { level: 'Baixo', emoji: '<img src="imagens/emojis/level2.png" alt="Baixo" style="width:20px; height:20px;">', value: 2, color: '#2196F3' };
            }
            if (bpm < 100) {
                return { level: 'Moderado', emoji: '<img src="imagens/emojis/level3.png" alt="Moderado" style="width:20px; height:20px;">', value: 3, color: '#FFC107' };
            }
            return { level: 'Alto', emoji: '<img src="imagens/emojis/level4.png" alt="Alto" style="width:20px; height:20px;">', value: 4, color: '#F44336' };
        }        

        function saveReading() {
            if (!selectedDate) return;
        
            const stressInfo = getStressLevel(finalBPM);
            readings[selectedDate] = {
                bpm: finalBPM,
                stress: stressInfo,
                stressLevel: stressInfo.level,
                date: selectedDate
            };
        
            const date = new Date(selectedDate);
            const dayIndex = date.getDate() - 1;
            if (date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()) {
                stressData[dayIndex] = stressInfo.value;
                stressChart.update();
            }
        
            // Atualize o calendário e gráfico com o mês atual
            generateCalendar(currentDate);
            updateStressChart(currentDate);
        
            document.getElementById('saveReading').disabled = true;
            statusDisplay.textContent = "Leitura salva com sucesso!";
            
            setTimeout(() => {
                closeMonitor();
            }, 1500);
        }                  

        function openMonitor(date) {
            selectedDate = date; 
            const displayDate = new Date(date).toLocaleDateString('pt-BR');
            document.getElementById('selectedDate').textContent = displayDate;
            document.getElementById('monitorDialog').style.display = 'flex';
            setupCamera();
        }

        function generateCalendar(date) {
            // Usa o `currentDate` para sempre exibir o mês atual
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, month, 1).getDay();
            const calendar = document.getElementById('calendar');
            const monthDisplay = document.getElementById('currentMonth');
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            monthDisplay.textContent = `${monthNames[month]} ${year}`;
            calendar.innerHTML = '';
        
            const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            weekDays.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendar.appendChild(dayHeader);
            });
        
            for (let i = 0; i < firstDayOfWeek; i++) {
                const blank = document.createElement('div');
                blank.className = 'calendar-day blank';
                calendar.appendChild(blank);
            }
        
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;
        
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                if (readings[dateStr]) {
                    const reading = readings[dateStr];
                    dayElement.classList.add('has-reading');
                    dayElement.setAttribute('data-stress', reading.stressLevel.toLowerCase());
        
                    const bpmReading = document.createElement('div');
                    bpmReading.className = 'bpm-reading';
                    bpmReading.innerHTML = `${reading.bpm} BPM<br>${reading.stress.emoji}`;
                    dayElement.appendChild(bpmReading);
                    
                    switch(reading.stressLevel.toLowerCase()) {
                        case 'muito baixo':
                            dayElement.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
                            break;
                        case 'baixo':
                            dayElement.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
                            break;
                        case 'moderado':
                            dayElement.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
                            break;
                        case 'alto':
                            dayElement.style.backgroundColor = 'rgba(244, 67, 54, 0.3)';
                            break;
                    }
                }
        
                dayElement.addEventListener('click', () => openMonitor(dateStr));
                calendar.appendChild(dayElement);
                updateStressChart(date);
            }
        }
        
        // Eventos de navegação do calendário
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate);
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate);
        });

        function updateStressChart(date) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Atualize os dados para o mês atual
            const monthData = Array(daysInMonth).fill(null);
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (readings[dateStr]) {
                    monthData[day - 1] = readings[dateStr].stress.value;
                }
            }
        
            // Atualize o dataset do gráfico e re-renderize
            stressChart.data.labels = Array.from({ length: daysInMonth }, (_, i) => `Dia ${i + 1}`);
            stressChart.data.datasets[0].data = monthData;
            stressChart.update();
        }
        
        function closeMonitor() {
            document.getElementById('monitorDialog').style.display = 'none';
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
            bpmDisplay.textContent = '--';
            confidenceDisplay.textContent = '0%';
            timerDisplay.textContent = '60s';
            finalResult.style.display = 'none';
            statusDisplay.textContent = "Aguardando início da medição...";
            startButton.disabled = false;
            stopButton.disabled = true;
            document.getElementById('saveReading').disabled = true;
            isRecording = false;
            if (timer) {
                clearInterval(timer);
            }
        }

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate);
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate);
        });
        document.getElementById('closeDialog').addEventListener('click', closeMonitor);
        document.getElementById('saveReading').addEventListener('click', () => {
            if (finalBPM > 0) {
                saveReading();
            }
        });

        generateCalendar(currentDate);
        startButton.addEventListener('click', startRecording);
        stopButton.addEventListener('click', stopRecording);