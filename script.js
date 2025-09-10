let studentsData = [];
let nameAnalysis = {};

document.addEventListener('DOMContentLoaded', function () {
    loadCSVData();
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') searchName();
    });
});

async function loadCSVData() {
    try {
        const response = await fetch("nome_aluno.csv");
        if (!response.ok) throw new Error("Arquivo não encontrado");
        const csvText = await response.text();
        processCSVData(csvText);
        // document.getElementById('fileStatus').innerText = "CSV carregado automaticamente!";
    } catch (error) {
        document.getElementById('fileStatus').innerText = "Por favor, selecione um arquivo CSV.";
        document.getElementById('uploadBtn').style.display = "inline-block";
    }
}

function loadSelectedFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        processCSVData(event.target.result);
        document.getElementById('fileStatus').innerText = "CSV carregado manualmente!";
    };
    reader.readAsText(file, 'UTF-8');
}

function processCSVData(csvText) {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            studentsData = results.data.filter(row => row.nome_aluno && row.nome_aluno.trim() !== '');
            if (studentsData.length === 0) {
                showError('Nenhum dado válido encontrado no CSV. Verifique se a coluna se chama "nome_aluno".');
                return;
            }
            document.getElementById('searchSection').style.display = 'block';
            document.getElementById('fileStatus').innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 10px; border-left: 5px solid #28a745;">
          ✅ Arquivo carregado com sucesso! ${studentsData.length} alunos encontrados.
        </div>`;
            analyzeNames();
            createDashboard();
        }
    });
}

function analyzeNames() {
    nameAnalysis = {
        firstNames: {},
        fullNames: studentsData.map(student => student.nome_aluno.trim()),
        total: studentsData.length
    };
    studentsData.forEach(student => {
        const fullName = student.nome_aluno.trim();
        const firstName = fullName.split(' ')[0].toUpperCase();
        if (!nameAnalysis.firstNames[firstName]) {
            nameAnalysis.firstNames[firstName] = { count: 0, fullNames: [] };
        }
        nameAnalysis.firstNames[firstName].count++;
        nameAnalysis.firstNames[firstName].fullNames.push(fullName);
    });
}

function createDashboard() {
    createStats();
    createCharts();
}

function createStats() {
    const statsContainer = document.getElementById('stats');
    const uniqueFirstNames = Object.keys(nameAnalysis.firstNames).length;
    const mostCommonName = Object.entries(nameAnalysis.firstNames)
        .sort(([, a], [, b]) => b.count - a.count)[0];
    statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${nameAnalysis.total}</div>
      <div class="stat-label">Total de Alunos</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${uniqueFirstNames}</div>
      <div class="stat-label">Nomes Únicos</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${mostCommonName[1].count}</div>
      <div class="stat-label">Maior Frequência<br><small>${mostCommonName[0]}</small></div>
    </div>`;
}

function createCharts() {
    const dashboardContainer = document.getElementById('dashboard');
    const topNames = Object.entries(nameAnalysis.firstNames)
        .sort(([, a], [, b]) => b.count - a.count).slice(0, 10);
    dashboardContainer.innerHTML = `
    <div class="chart-container">
      <h3>📈 Top 10 Nomes Mais Comuns</h3>
      <canvas id="barChart"></canvas>
    </div>
    <div class="chart-container">
      <h3>🥧 Distribuição dos Top 5 Nomes</h3>
      <canvas id="pieChart"></canvas>
    </div>`;
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: topNames.map(([name]) => name),
            datasets: [{ data: topNames.map(([, d]) => d.count) }]
        }
    });
    new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: {
            labels: topNames.slice(0, 5).map(([name]) => name),
            datasets: [{ data: topNames.slice(0, 5).map(([, d]) => d.count) }]
        }
    });
}

function searchName() {
    const searchTerm = document.getElementById('searchInput').value.trim().toUpperCase();
    const resultsContainer = document.getElementById('searchResults');
    if (!nameAnalysis.fullNames || nameAnalysis.fullNames.length === 0) {
        resultsContainer.innerHTML = '<div class="error">Por favor, carregue o arquivo CSV antes de buscar.</div>';
        return;
    }
    if (!searchTerm) {
        resultsContainer.innerHTML = '<div class="error">Por favor, digite um nome para buscar.</div>';
        return;
    }
    const matchingFullNames = nameAnalysis.fullNames.filter(fullName =>
        fullName.toUpperCase().includes(searchTerm));
    if (matchingFullNames.length === 0) {
        resultsContainer.innerHTML = `
      <div class="result-card">
        <h4>❌ Nenhum resultado encontrado</h4>
        <p>O nome "${searchTerm}" não foi encontrado.</p>
      </div>`;
        return;
    }
    resultsContainer.innerHTML = `
    <div class="result-card">
      <h4>✅ Resultados para "${searchTerm}"</h4>
      <p><strong>Quantidade encontrada:</strong> ${matchingFullNames.length}</p>
      <div class="name-list">${matchingFullNames.map(name => `<div class="name-item">${name}</div>`).join('')}</div>
    </div>`;
}

function showError(message) {
    document.getElementById('dashboard').innerHTML = `<div class="error">${message}</div>`;
}
