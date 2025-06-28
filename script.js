document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const valorInput = document.getElementById('valor');
    const userIdInput = document.getElementById('userId');
    const paymentInfoDiv = document.getElementById('payment-info');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const pixCopiaEColaTextarea = document.getElementById('pixCopiaECola');
    const paymentStatusP = document.getElementById('payment-status');
    const feeInfoP = document.getElementById('fee-info');
    const checkBalanceBtn = document.getElementById('checkBalanceBtn');
    const balanceUserIdInput = document.getElementById('balanceUserId');
    const balanceInfoDiv = document.getElementById('balance-info');

    let currentPaymentId = null;

    // Função para gerar um ID de usuário único
    const generateUniqueId = () => {
        return 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    };

    // Define um ID único quando a página carrega
    if (userIdInput) {
        userIdInput.value = generateUniqueId();
    }

    valorInput.addEventListener('input', () => {
        const valor = parseFloat(valorInput.value);
        if (!isNaN(valor) && valor > 0) {
            const taxa = 5.00 + (valor * 0.10);
            const valorFinal = valor - taxa;
            if (feeInfoP) {
                feeInfoP.textContent = `Taxa: R$ ${taxa.toFixed(2)} | Você recebe: R$ ${valorFinal.toFixed(2)}`;
            }
        } else if (feeInfoP) {
            feeInfoP.textContent = '';
        }
    });

    generateBtn.addEventListener('click', async () => {
        const valor = valorInput.value;
        const userId = userIdInput.value;

        if (!userId) {
            alert('Não foi possível gerar um ID de usuário. Recarregue a página.');
            return;
        }

        if (!valor || parseFloat(valor) < 1.06) {
            alert('Por favor, insira um valor de no mínimo R$1.06.');
            return;
        }

        const targetUrl = `https://caospayment.shop/create_payment?user_id=${userId}&valor=${valor}`;
        const apiUrl = `/api/proxy?apiUrl=${encodeURIComponent(targetUrl)}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            qrCodeImg.src = `data:image/png;base64,${data.qrcode_base64}`;
            pixCopiaEColaTextarea.value = data.pixCopiaECola;
            currentPaymentId = data.external_id; // Assuming 'external_id' is the 'payment_id' for verification

            paymentInfoDiv.classList.remove('hidden');
            paymentStatusP.textContent = '';

        } catch (error) {
            alert(`Erro ao gerar pagamento: ${error.message}`);
        }
    });

    copyBtn.addEventListener('click', () => {
        pixCopiaEColaTextarea.select();
        document.execCommand('copy');
        alert('Código PIX copiado para a área de transferência!');
    });

    verifyBtn.addEventListener('click', async () => {
        if (!currentPaymentId) {
            alert('Gere um QR Code primeiro.');
            return;
        }

        const targetUrl = `https://caospayment.shop/verify_payment?payment_id=${currentPaymentId}`;
        const apiUrl = `/api/proxy?apiUrl=${encodeURIComponent(targetUrl)}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                paymentStatusP.textContent = `Status: ${data.error}`;
                paymentStatusP.style.color = 'red';
                return;
            }

            paymentStatusP.textContent = `Status: ${data.status_pagamento}`;
            if (data.status_pagamento === 'CONCLUIDA') {
                paymentStatusP.style.color = 'green';

                // Adicionar o valor ao saldo do usuário
                const valor = parseFloat(valorInput.value);
                const userId = userIdInput.value;
                if (!isNaN(valor) && userId) {
                    await fetch('/api/add-balance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId, amount: valor }),
                    });
                }
            } else {
                paymentStatusP.style.color = 'orange';
            }

        } catch (error) {
            alert(`Erro ao verificar pagamento: ${error.message}`);
        }
    });

    checkBalanceBtn.addEventListener('click', async () => {
        const userId = balanceUserIdInput.value;
        if (!userId) {
            alert('Por favor, insira um ID de carteira para consultar.');
            return;
        }

        try {
            const response = await fetch(`/api/get-balance?userId=${userId}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (balanceInfoDiv) {
                balanceInfoDiv.textContent = `Saldo disponível: R$ ${parseFloat(data.balance).toFixed(2)}`;
                balanceInfoDiv.style.color = 'green';
            }

        } catch (error) {
            if (balanceInfoDiv) {
                balanceInfoDiv.textContent = `Erro ao consultar saldo: ${error.message}`;
                balanceInfoDiv.style.color = 'red';
            }
            alert(`Erro ao consultar saldo: ${error.message}`);
        }
    });
});