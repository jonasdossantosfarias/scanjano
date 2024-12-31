// Elementos principais do DOM usados no script
const calendar = document.getElementById('calendar');
const currentMonthLabel = document.getElementById('current-month');
const inputDialog = document.getElementById('input-dialog');
const dialogDateDisplay = document.getElementById('dialog-date-display');
const dialogMoodSelect = document.getElementById('dialog-mood-select');
const dialogNote = document.getElementById('dialog-note');
const dialogPhotoUpload = document.getElementById('dialog-photo-upload');
const dialogAudioPlayback = document.getElementById('audio-playback');
const fullImageContainer = document.getElementById('full-image-container');
const fullImage = document.getElementById('full-image');
const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');
const deleteAudioButton = document.getElementById('delete-audio');
const audioPlayback = document.getElementById('audio-playback');
const firebaseConfig = {
    apiKey: "AIzaSyB_KgO3n6BzWejWFwDJs0wwreS18QB_z40",
    authDomain: "calhumorjano.firebaseapp.com",
    projectId: "calhumorjano",
    storageBucket: "calhumorjano.appspot.com",
    messagingSenderId: "920817014794",
    appId: "1:920817014794:web:cce90cfd082a022621e7f3",
    measurementId: "G-2GKTHK0RMP"
};

// Define a data atual como padrão no campo de data
const today = new Date().toISOString().split('T')[0];

// Criação do gráfico de humor usando Chart.js
const moodChartCtx = document.getElementById('moodChart').getContext('2d');
const moodChart = new Chart(moodChartCtx, {
    type: 'doughnut',
    data: {
        labels: ['Feliz', 'Triste', 'Bravo', 'Cansado', 'Ansioso', 'Animado', 'Chateado', 'Pensativo', 'Grato', 'Frustrado', 'Divertido', 'Calmo'],
        datasets: [{
            label: 'Humores do Mês',
            data: Array(12).fill(0),
            backgroundColor: [
                '#FFEB3B', '#90CAF9', '#F44336', '#CE93D8', '#FF9800',
                '#4CAF50', '#42A5F5', '#FFC107', '#8BC34A', '#E53935',
                '#FFAB40', '#B2FF59'
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 10
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                        const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                        return `${percentage}%`;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    }
});

// Inicializa os dados do ânimo para os últimos 30 dias, inicialmente vazios
let animoData = Array(30).fill(null);
let currentDate = new Date();
let moodData = {}; // Armazena os registros de humor
let mediaRecorder;
let audioChunks = [];

// Criação do gráfico de ânimo usando Chart.js
const animoChartCtx = document.getElementById('animoChart').getContext('2d');
const animoChart = new Chart(animoChartCtx, {
    type: 'line',
    data: {
        labels: Array.from({ length: 30 }, (_, i) => `Dia ${i + 1}`),
        datasets: [{
            label: 'Nível de Ânimo',
            data: animoData,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 3,
            fill: true,
            tension: 0.4,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 3,
                ticks: {
                    stepSize: 1
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `Nível: ${context.raw}`;
                    }
                }
            }
        }
    }
});

// Atualiza o calendário exibido na tela
function updateCalendar() {
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthLabel.innerText = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Preenchendo os dias vazios antes do início do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDay = document.createElement('div');
        calendar.appendChild(emptyDay);
    }

    // Preenchendo os dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.classList.add('day');
        const dayString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        day.dataset.date = dayString;
        day.innerHTML = `<div class="date-label">${i}</div>`;
        day.addEventListener('click', () => {
            if (moodData[dayString]) {
                closeInputDialog();
                showDescription(day);
            } else {
                closeInputDialog();
                openInputDialog(dayString);
            }
        });

        if (moodData[dayString]) {
            const { mood, note, time, photoURL, audioURL } = moodData[dayString];
            day.innerHTML += `<div class="emoji"><img src="imagens/emojis/${mood.toLowerCase()}.png" alt="${mood}" style="width: 24px; height: 24px;"></div>`;
            day.dataset.note = note;
            day.dataset.time = time;
            if (photoURL) {
                day.dataset.photo = photoURL;
            }
            if (audioURL) {
                day.dataset.audio = audioURL;
            }
            day.style.backgroundColor = getMoodColor(mood);
        }

        calendar.appendChild(day);
    }
    updateChart();
    updateAnimoChart();
}

// Altera o mês exibido no calendário (anterior ou próximo)
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateCalendar();
    updateChart();
    updateAnimoChart();
}

// Abre o diálogo para registrar o humor do dia
function openInputDialog(date) {
    if (dialogDateDisplay) {
        const dateParts = date.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        dialogDateDisplay.textContent = formattedDate; // Atualiza a div com a data formatada
    } else {
        console.error('Elemento dialog-date-display não encontrado');
    }

    // Se houver registro de humor para a data, preencha os campos do diálogo
    if (moodData[date]) {
        dialogMoodSelect.value = moodData[date].mood;
        dialogNote.value = moodData[date].note || "";
    } else {
        dialogMoodSelect.value = "feliz.png"; // Valor padrão
        dialogNote.value = "";
    }

    inputDialog.style.display = 'block';
}

// Fecha o diálogo de registro de humor
function closeInputDialog() {
    inputDialog.style.display = 'none';
}

// Inicializa o Firebase caso não esteja inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Referências para o Firebase Auth, Firestore e Storage
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Aguardar autenticação do usuário para carregar os dados do calendário
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await refreshMoodData();
        updateCalendar();
        updateChart(); // Atualiza o gráfico de humor após carregar os dados
        updateAnimoChart(); // Atualiza o gráfico de ânimo após carregar os dados
    } else {
        console.log('Usuário não autenticado. Aguardando login para carregar o calendário.');
    }
});

// Função para salvar o humor do dia e atualizar o Firebase Firestore
async function saveMood() {
    const date = dialogDateDisplay.textContent.split('/').reverse().join('-');
    const moodValue = dialogMoodSelect.value;
    const moodText = dialogMoodSelect.options[dialogMoodSelect.selectedIndex].dataset.text; // Pega o texto do humor
    const note = dialogNote.value;
    const photoFile = dialogPhotoUpload.files[0];
    const audioBlob = audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/mpeg' }) : null;

    const willingnessInputs = document.querySelectorAll('input[name="willingness"]');
    let animoLevel = null;
    willingnessInputs.forEach(input => {
        if (input.checked) {
            switch (input.value) {
                case "Muito Baixa":
                    animoLevel = 0;
                    break;
                case "Baixa":
                    animoLevel = 1;
                    break;
                case "Média":
                    animoLevel = 2;
                    break;
                case "Alta":
                    animoLevel = 3;
                    break;
            }
        }
    });

    if (!auth.currentUser) {
        console.error('Usuário não está autenticado.');
        return;
    }

    const userId = auth.currentUser.uid;
    console.log(`Salvando dados para o usuário: ${userId}`); // Log para depuração
    const moodDocRef = db.collection('pacientes').doc(userId).collection('humor').doc(date);

    try {
        let photoURL = null;
        if (photoFile) {
            const photoRef = storage.ref().child(`humor_photos/${userId}/${date}`);
            console.log(`Enviando foto para: humor_photos/${userId}/${date}`); // Log para depuração
            const photoSnapshot = await photoRef.put(photoFile);
            photoURL = await photoSnapshot.ref.getDownloadURL();
        }

        let audioURL = null;
        if (audioBlob) {
            const audioRef = storage.ref().child(`humor_audios/${userId}/${date}`);
            console.log(`Enviando áudio para: humor_audios/${userId}/${date}`); // Log para depuração
            const audioSnapshot = await audioRef.put(audioBlob);
            audioURL = await audioSnapshot.ref.getDownloadURL();
        }

        // Salvar os dados no Firestore
        await moodDocRef.set({
            mood: moodText,
            date: date,
            note: note,
            animoLevel: animoLevel,
            photoURL: photoURL,
            audioURL: audioURL
        });

        console.log('Registro de humor salvo com sucesso no Firestore.');
        
        // Mostrar a mensagem de humor registrado
        alert('Humor registrado com sucesso.');
        
    } catch (error) {
        console.error('Erro ao salvar humor no Firestore:', error);
    }

    closeInputDialog();
    await refreshMoodData();
    updateCalendar();
    updateCharts();
}

async function refreshMoodData() {
    if (!auth.currentUser) {
        console.error('Usuário não está autenticado.');
        return;
    }

    const userId = auth.currentUser.uid;
    const humorCollectionRef = db.collection('pacientes').doc(userId).collection('humor');

    try {
        console.log(`Carregando registros de humor para o usuário: ${userId}`);
        const snapshot = await humorCollectionRef.get();
        moodData = {};
        
        snapshot.forEach(doc => {
            moodData[doc.id] = doc.data();
        });

        console.log('Dados de humor atualizados:', moodData);
        
        // Atualize o calendário e gráficos após carregar os dados
        updateCalendar();
        updateChart();
        updateAnimoChart();
    } catch (error) {
        console.error('Erro ao carregar registros de humor do Firestore:', error);
    }
}

// Função para atualizar os gráficos com base nos dados atuais de humor
function updateChart() {
    const moodCount = Array(12).fill(0);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Iterar sobre registros para contar apenas aqueles do mês atual
    for (const key in moodData) {
        const [dataAno, dataMes, dataDia] = key.split('-').map(Number);
        
        if (dataAno === year && (dataMes - 1) === month) {
            const moodText = moodData[key].mood;
            const index = Array.from(dialogMoodSelect.options).findIndex(option => option.dataset.text === moodText);
            if (index !== -1) {
                moodCount[index]++;
            }
        }
    }

    moodChart.data.datasets[0].data = moodCount;
    moodChart.options.plugins.title = {
        display: true,
        text: `Humores do Mês - ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    };
    moodChart.update();
}

async function refreshMoodData() {
    if (!auth.currentUser) {
        console.error('Usuário não está autenticado.');
        return;
    }

    const userId = auth.currentUser.uid;
    const humorCollectionRef = db.collection('pacientes').doc(userId).collection('humor');

    try {
        console.log(`Carregando registros de humor para o usuário: ${userId}`);
        const snapshot = await humorCollectionRef.get();
        moodData = {};
        
        snapshot.forEach(doc => {
            moodData[doc.id] = doc.data();
        });

        console.log('Dados de humor atualizados:', moodData);
        
        // Atualize o calendário e gráficos após carregar os dados
        updateCalendar();
        updateChart();
        updateAnimoChart();
    } catch (error) {
        console.error('Erro ao carregar registros de humor do Firestore:', error);
    }
}

function updateAnimoChart() {
    // Determina o número correto de dias no mês atual
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Número correto de dias no mês atual

    const updatedAnimoData = Array(daysInMonth).fill(null);

    // Itera sobre moodData e preenche os níveis de ânimo apenas para o mês e ano atuais
    for (const key in moodData) {
        const moodEntry = moodData[key];
        const [dataAno, dataMes, dataDia] = key.split('-').map(Number);

        if (dataAno === year && (dataMes - 1) === month) {
            const dayIndex = dataDia - 1; // Ajuste do índice (de 1 a 31 para 0 a 30)
            if (moodEntry.animoLevel !== null && dayIndex >= 0 && dayIndex < daysInMonth) {
                updatedAnimoData[dayIndex] = moodEntry.animoLevel;
            }
        }
    }

    // Atualizando os dados do gráfico de ânimo
    animoChart.data.labels = Array.from({ length: daysInMonth }, (_, i) => `Dia ${i + 1}`);
    animoChart.data.datasets[0].data = updatedAnimoData;

    // Atualizando o título do gráfico
    animoChart.options.plugins.title = {
        display: true,
        text: `Progresso de Ânimo - ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    };

    animoChart.update();
}

// Atualiza o calendário ao carregar a página
document.addEventListener('DOMContentLoaded', async function () {
    if (auth.currentUser) {
        await refreshMoodData();
        updateCalendar();
        updateChart();  // Atualiza o gráfico de humor ao carregar os dados
        updateAnimoChart();  // Atualiza o gráfico de ânimo ao carregar os dados
    } else {
        console.log('Usuário não autenticado. Aguardando login para carregar o calendário.');
    }
});

// Função para atualizar o calendário após salvar o humor
function updateCalendar() {
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Definindo o título do mês atual
    currentMonthLabel.innerText = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Primeiro dia do mês atual e quantos dias ele possui
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // Dia da semana que começa o mês
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Número de dias no mês atual

    // Ajuste para garantir que o calendário sempre comece pelo dia 1, independentemente do dia da semana
    let adjustedFirstDay = firstDayOfMonth;
    if (adjustedFirstDay === 0) {
        adjustedFirstDay = 7; // Tratando o domingo (dia 0) como o último dia da semana
    }

    // Preenchendo os dias vazios antes do início do mês (para alinhamento correto)
    for (let i = 1; i < adjustedFirstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('empty-day');
        calendar.appendChild(emptyDay);
    }

    // Preenchendo os dias do mês a partir do dia 1
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.classList.add('day');
        const dayString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        day.dataset.date = dayString;
        day.innerHTML = `<div class="date-label">${i}</div>`;
        day.addEventListener('click', () => {
            if (moodData[dayString]) {
                closeInputDialog();
                showDescription(day);
            } else {
                closeInputDialog();
                openInputDialog(dayString);
            }
        });

        // Verificar se há registro de humor para aquele dia e adicionar ícone/emoji correspondente
        if (moodData[dayString]) {
            const { mood, note, time, photoURL, audioURL } = moodData[dayString];
            day.innerHTML += `<div class="emoji"><img src="imagens/emojis/${mood.toLowerCase()}.png" alt="${mood}" style="width: 24px; height: 24px;"></div>`;
            day.dataset.note = note;
            day.dataset.time = time;
            if (photoURL) {
                day.dataset.photo = photoURL;
            }
            if (audioURL) {
                day.dataset.audio = audioURL;
            }
            day.style.backgroundColor = getMoodColor(mood);
        }

        // Adicionando o dia ao calendário
        calendar.appendChild(day);
    }
}

// Aguardar autenticação do usuário para carregar os dados do calendário
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await refreshMoodData();
        updateCalendar();
    } else {
        console.log('Usuário não autenticado. Aguardando login para carregar o calendário.');
    }
});

// Função para obter a cor associada ao humor selecionado
function getMoodColor(mood) {
    switch (mood) {
        case 'Feliz':
            return '#FFEB3B';
        case 'Triste':
            return '#90CAF9';
        case 'Bravo':
            return '#F44336';
        case 'Cansado':
            return '#CE93D8';
        case 'Ansioso':
            return '#FF9800';
        case 'Animado':
            return '#4CAF50';
        case 'Chateado':
            return '#42A5F5';
        case 'Pensativo':
            return '#FFC107';
        case 'Grato':
            return '#8BC34A';
        case 'Frustrado':
            return '#E53935';
        case 'Divertido':
            return '#FFAB40';
        case 'Calmo':
            return '#B2FF59';
        default:
            return '#ffffff';
    }
}

// Exibe a descrição do humor registrado para o dia selecionado
function showDescription(dayElement) {
    let description = document.createElement('div');
    description.classList.add('mood-description', 'show-description');

    // Recuperar o valor do humor salvo no dataset do elemento do dia
    const mood = dayElement.dataset.mood ? `<strong>${dayElement.dataset.mood}</strong>` : 'Não registrado';

    description.innerHTML = `Humor: ${mood}<br>
        Data: ${dayElement.dataset.date.replace(/-/g, '/')}<br>
        Anotação: ${dayElement.dataset.note || 'Nenhuma anotação'}<br>`;

    if (dayElement.dataset.photo) {
        description.innerHTML += `<br><img src="${dayElement.dataset.photo}" alt="Foto do humor" class="thumbnail" onclick="showFullImage('${dayElement.dataset.photo}')">`;
    }

    if (dayElement.dataset.audio) {
        description.innerHTML += `<br><audio controls src="${dayElement.dataset.audio}" style="margin-top: 10px;"></audio>`;
    }

    description.innerHTML += `<br><div class="button-container">
        <button onclick="closeDescription(this)">OK</button>
        <button onclick="openInputDialog('${dayElement.dataset.date}'); closeDescription(this)">Editar</button>
    </div>`;

    document.body.appendChild(description);
}

// Exibe uma imagem em tela cheia
function showFullImage(photoSrc) {
    fullImage.src = photoSrc;
    fullImageContainer.style.display = 'block';
}

// Fecha a exibição de imagem em tela cheia
function closeFullImage() {
    fullImageContainer.style.display = 'none';
}

// Fecha a descrição do humor do dia
function closeDescription(button) {
    const description = button.parentElement.parentElement;
    description.classList.remove('show-description');
    setTimeout(() => {
        description.remove();
    }, 300);
}

// Simulação de captura de foto (somente dispositivos que suportam captura de imagem)
function capturePhoto() {
    dialogPhotoUpload.click();
}

// Função para iniciar a gravação
function startRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            // Quando a gravação parar, cria o objeto Blob do áudio
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                const audioURL = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioURL;
                audioPlayback.style.display = 'block';
                stopRecordingButton.disabled = true;
                deleteAudioButton.disabled = false;
            });

            startRecordingButton.disabled = true;
            stopRecordingButton.disabled = false;
        });
    }
}

// Função para parar a gravação
function stopRecording() {
    mediaRecorder.stop();
    stopRecordingButton.disabled = true;
    startRecordingButton.disabled = false;
}

// Função para apagar o áudio gravado
function deleteRecording() {
    audioChunks = [];
    audioPlayback.src = '';
    audioPlayback.style.display = 'none';
    deleteAudioButton.disabled = true;
}

// Atualiza o calendário ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    updateCalendar();
});

