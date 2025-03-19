document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente carregado!");

    let questions = [];                                                             // Array para armazenar as perguntas carregadas do arquivo JSON
    let currentQuestionIndex = 0;                                                   // Índice da pergunta atual
    let currentAudio = null;                                                        // Variável para armazenar o áudio da pergunta em reprodução
    let userResponses = [];                                                         // Array para armazenar as respostas do usuário
    const microphoneElement = document.getElementById("microphone");
    const receivedElement = document.querySelector(".received-content strong");
    const textContainer = document.querySelector(".text-contentor");

    if (!receivedElement || !textContainer) {
        console.error("Erro: Elementos essenciais não encontrados!");
        return;
    }

    let currentAmount = parseInt(receivedElement.textContent.replace("$", ""), 10); // Valor numérico extraído do elemento "receivedElement"

//--------------------------------INCREMENTAR DINHEIRO------------------------------------
    function incrementAmount() {
        currentAmount += 100;                                                       //Incrementar 100 em cada 10s
    
        // Verifica se já tem "-" antes de atualizar
        if (receivedElement.textContent.includes("-")) {                            //Se o valor incluir negativo quando a conversa finalizou permanecer a incrementar negativamente
            receivedElement.textContent = `-${currentAmount}$`;
        } else {
            receivedElement.textContent = `${currentAmount}$`;
        }
    }

    setInterval(incrementAmount, 10000);

//--------------------------------SCROLL AUTOMÁTICO PARA BAIXO-----------------------------
    function scrollToBottom() {
        if (textContainer) {
            textContainer.scrollTo({
                top: textContainer.scrollHeight,
                behavior: "smooth"                                                  //[linha copiada pelo CHATGPT]
            });
        }
    }

//--------------------------------CARREGAR PERGUNTAS DO JSON-------------------------------
    async function loadQuestions() {
        try {
            const response = await fetch("voice.json");                            // Faz o carregamento das perguntas a partir do arquivo JSON
            if (!response.ok) throw new Error("Falha ao carregar as questões");

            questions = (await response.json()).questions;                         // Armazena as perguntas no array "questions"
            console.log("Perguntas carregadas:", questions);
        } catch (error) {
            console.error("Erro ao carregar questões:", error);
        }
    }

//------------------VERIFICAR SE A PERGUNTA ATUAL FOI RESPONDIDA E PASSAR A PROXIMA--------
    function playNextQuestion() {
        if (currentAudio && !currentAudio.ended) {
            console.log("Aguardando o término da pergunta atual...");
            return;
        }
    
        if (currentQuestionIndex < questions.length) {                              // Verificar se não excede os limites do questions.length
            const currentQuestion = questions[currentQuestionIndex];                // Obtém a pergunta atual
    
            currentAudio = new Audio(currentQuestion.audio);                        // Cria um novo objeto de áudio para a pergunta
    
            currentAudio.onended = function () {                                    // função para quando  o audio terminar
                currentAudio = null;                                                // Fica a null para não passar para a seguinte sem ouvir primeiro
                startListening();                                                   // Inicia o reconhecimento de voz após a pergunta
            };
    
            currentAudio.play();
    
            const questionDiv = document.createElement("div");
            questionDiv.classList.add("question-container");
    
            const questionText = document.createElement("p");
            questionText.textContent = currentQuestion.text;
            questionText.classList.add("question-text");
    
            questionDiv.appendChild(questionText);
            textContainer.appendChild(questionDiv);
            scrollToBottom();                                                       //quando o textContainer recebe o filho questionDiv o scroll têm que descer para acompanhar o que acabou de ser inserido no contentor
        } else {                                                                    //Caso tenha chegado ao fim de todas as perguntas
            const responsesContainer = document.createElement("div");
            responsesContainer.classList.add("responses-summary");

            receivedElement.textContent = `-${currentAmount}$`;                     //Coloca o received a negativo

            //mensagem com o respeito indice do array de respostas capturadas
            const messageTemplate = `The algorithm has been taught!                 
            Thank you for your contribution. We possess all your data and shall 
            extract even more information. You are ${userResponses[1] || "[1]"} were born in ${userResponses[3] || "[3]"} (${userResponses[2] || "[2]"}).
            After your ${userResponses[11] || "[11]"}, you shall engage in ${userResponses[4] || "[4]"} at the esteemed ${userResponses[5] || "[5]"}.
            During your childhood, you resided in ${userResponses[7] || "[7]"} in ${userResponses[6] || "[6]"} whilst pursuing your studies at ${userResponses[12] || "[12]"}.`;

            const responseParagraph = document.createElement("p");
            responseParagraph.textContent = messageTemplate;
            responseParagraph.classList.add("response-item");
            responsesContainer.appendChild(responseParagraph);

            textContainer.appendChild(responsesContainer);
            scrollToBottom();

            const audio = new Audio("voices/audiofinal.mp3");                       //adiciona o audio final e dá play
            audio.play();
        }
    }
    
//------------------ATIVAR O MODO DE OUVIR E CAPTURAR FALA----------------------------------
    function startListening() {
        if (annyang) {                                                              //uso da biblioteca annyang
            annyang.setLanguage("en-US");

            annyang.addCallback("soundstart", function () {                         //Quando houver callback alterar a cor do micro
                microphoneElement.style.backgroundColor = "red";
            });

            annyang.addCallback("result", function (phrases) {                      // Quando uma frase é reconhecida
                if (!phrases || phrases.length === 0) {
                    console.log("Nenhuma resposta detectada, continuando a escuta...");
                    return;                                                         //Continuar com o microligado
                }

                if (annyang.isProcessing) return;                                   //Verifica o estado
                annyang.isProcessing = true;                                        //Se for true, ele retorna imediatamente, ou seja, não processa a resposta novamente.

                let userResponse = phrases[0];                                      // Captura a primeira frase reconhecida (a biblioteca cria um array com várias palavras semelhantes e escolhe a melhor) aqui ele escolhe a melhor que é sempre o 1
                userResponses.push(userResponse);                                   // Armazena a resposta no array "userResponses" [linha copiada pelo CHATGPT]
                console.log("Respostas do usuário:", userResponses);

                console.log("Usuário disse:", userResponse);

                const responseDiv = document.createElement("div");
                responseDiv.classList.add("response-container");

                const responseText = document.createElement("p");
                responseText.textContent = userResponse;
                responseText.classList.add("response-text");

                responseDiv.appendChild(responseText);
                textContainer.appendChild(responseDiv);
                scrollToBottom();

                annyang.abort();                                                    // Parar a audição da biblioteca após capturar a resposta
                microphoneElement.style.backgroundColor = "";                       //Volta a cor normal do microfone

                setTimeout(() => {
                    currentQuestionIndex++;                                         // Avança para a próxima pergunta
                    annyang.isProcessing = false;                                   // adiciona a variavel em falso para não retornar a resposta anterior
                    playNextQuestion();
                }, 2000);
            });

            annyang.addCallback("error", function (error) {
                console.error("Erro no reconhecimento de fala:", error);
            });

            annyang.start({ autoRestart: true, continuous: true });                 // Inicia o reconhecimento de voz (autoRestart: true caso for interrompido tenta reinicia-lo) (continuos: continuar a ouvir sem parar após uma resposta única) [linha copiada pelo CHATGPT]
        } else {
            alert("navegador não suporta reconhecimento de voz!");
        }
    }

//------------------FUNÇÃO PARA COMEÇAR INTERAÇÃO----------------------------------
    function startInteraction() {
        playNextQuestion();
    }

 //------------------CHAMAR FUNÇÃO DE UPLOAD QUESTÕES-------------------------------
    loadQuestions();

    setTimeout(startInteraction, 5000);                                              // Quando se abre o programa inicia automaticamente após 10 segundos
});
