// 定时寄出邮件功能 (测试版本 - 10秒后发送)

document.addEventListener('DOMContentLoaded', () => {
    const scheduleForm = document.getElementById('schedule-form');
    const statusMessage = document.getElementById('status-message');
    const emailInput = document.getElementById('email');
    const emailVerifiedCheckbox = document.getElementById('email-verified-checkbox');
    const emailVerifiedLabel = document.getElementById('email-verified-label');
    const selfMessageInput = document.getElementById('self-message');
    const sendButton = document.getElementById('send-btn');
    const scheduledDateDisplay = document.getElementById('scheduled-date-display');
    
    // Modal elements
    const verificationModal = document.getElementById('verification-modal');
    const triggerVerificationModalButton = document.getElementById('trigger-verification-modal');
    const closeVerificationModalButton = document.getElementById('close-verification-modal');
    const modalEmailDisplay = document.getElementById('modal-email-display');
    const sendVerificationCodeButton = document.getElementById('send-verification-code');
    const verificationCodeInput = document.getElementById('verification-code');
    const verifyCodeButton = document.getElementById('verify-code');
    const verificationStatus = document.getElementById('verification-status');

    // QQ Login Modal elements (for mobile)
    const qqLoginLinkMobile = document.querySelector('.email-provider-link[href*="mail.qq.com"]');
    const qqLoginModalMobile = document.getElementById('qq-login-modal-mobile');
    const closeQQLoginModalMobile = document.getElementById('close-qq-login-modal-mobile');
    const qqLoginConfirmBtnMobile = document.getElementById('qq-login-confirm-btn-mobile');
    const qqLoginCancelBtnMobile = document.getElementById('qq-login-cancel-btn-mobile');

    // Cloudflare Worker 的 URL
    const baseWorkerUrl = 'https://pxt.sanyi.us.kg'; // 请确保这个URL是正确的测试环境URL
    const sendVerificationEmailUrl = `${baseWorkerUrl}/send-verification-email`;
    const verifyEmailUrl = `${baseWorkerUrl}/verify-email`;
    const scheduleEmailUrl = `${baseWorkerUrl}/schedule-email`;

    if (triggerVerificationModalButton) {
        triggerVerificationModalButton.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                statusMessage.textContent = '请输入有效的邮箱地址后再进行验证。';
                statusMessage.className = 'status-message error';
                emailInput.focus();
                return;
            }
            modalEmailDisplay.textContent = email;
            verificationModal.style.display = 'block';
            verificationStatus.textContent = '';
        });
    }

    if (qqLoginLinkMobile && qqLoginModalMobile) {
        qqLoginLinkMobile.addEventListener('click', (event) => {
            event.preventDefault();
            qqLoginModalMobile.style.display = 'block';
        });
    }

    if (closeQQLoginModalMobile) {
        closeQQLoginModalMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    if (qqLoginConfirmBtnMobile) {
        qqLoginConfirmBtnMobile.addEventListener('click', () => {
            window.open('https://mail.qq.com', '_blank');
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    if (qqLoginCancelBtnMobile) {
        qqLoginCancelBtnMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    if (closeVerificationModalButton) {
        closeVerificationModalButton.addEventListener('click', () => {
            verificationModal.style.display = 'none';
        });
    }

    async function handleSendVerificationCode() {
        const email = emailInput.value;
        if (!email) {
            verificationStatus.textContent = '请输入邮箱地址。';
            verificationStatus.className = 'status-error';
            return;
        }
        verificationStatus.textContent = '正在发送验证码...';
        verificationStatus.className = 'status-pending';
        try {
            const response = await fetch(sendVerificationEmailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (response.ok) {
                verificationStatus.textContent = result.message || '验证码已发送，请检查您的邮箱。';
                verificationStatus.className = 'status-success';
            } else {
                verificationStatus.textContent = result.error || '验证码发送失败，请重试。';
                verificationStatus.className = 'status-error';
            }
        } catch (error) {
            console.error('Error sending verification code:', error);
            verificationStatus.textContent = '请求失败，请检查网络连接或稍后再试。';
            verificationStatus.className = 'status-error';
        }
    }

    async function handleVerifyCode() {
        const email = emailInput.value;
        const code = verificationCodeInput.value;
        if (!email || !code) {
            verificationStatus.textContent = '请输入邮箱和验证码。';
            verificationStatus.className = 'status-error';
            return;
        }
        verificationStatus.textContent = '正在验证...';
        verificationStatus.className = 'status-pending';
        try {
            const response = await fetch(verifyEmailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const result = await response.json();
            if (response.ok) {
                verificationStatus.textContent = result.message || '邮箱验证成功！';
                verificationStatus.className = 'status-message success';
                emailVerifiedCheckbox.checked = true;
                emailVerifiedLabel.textContent = '邮箱已验证';
                emailInput.disabled = true;
                triggerVerificationModalButton.textContent = '邮箱已验证';
                triggerVerificationModalButton.disabled = true;
                verificationModal.style.display = 'none';
            } else {
                verificationStatus.textContent = result.error || '验证失败，请检查验证码或重新发送。';
                verificationStatus.className = 'status-message error';
                emailVerifiedCheckbox.checked = false;
                emailVerifiedLabel.textContent = '邮箱未验证';
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            verificationStatus.textContent = '请求失败，请检查网络连接或稍后再试。';
            verificationStatus.className = 'status-message error';
            emailVerifiedCheckbox.checked = false;
            emailVerifiedLabel.textContent = '邮箱未验证';
        }
    }

    async function handleScheduleEmail(event) {
        event.preventDefault();
        statusMessage.textContent = '正在处理请求...';
        statusMessage.className = 'status-message pending';

        if (!emailVerifiedCheckbox.checked) {
            statusMessage.textContent = '请点击“点击验证邮箱”按钮完成邮箱验证。';
            statusMessage.className = 'status-message error';
            if (verificationModal.style.display === 'none' && !emailInput.disabled) {
                triggerVerificationModalButton.focus(); 
            }
            return;
        }

        const message = selfMessageInput.value;
        const email = emailInput.value;

        if (!message) {
            statusMessage.textContent = '请填写自己想说的话。';
            statusMessage.className = 'status-error';
            return;
        }

        // 测试版本：发送时间设置为点击按钮时的时间的1分钟后
        const sendTime = new Date(Date.now() + 60000); // 60000毫秒 = 1分钟
        const sendDate = sendTime.toISOString();

        if (!email) {
            statusMessage.textContent = '邮箱地址丢失，请刷新页面重试。';
            statusMessage.className = 'status-error';
            return;
        }

        try {
            const response = await fetch(scheduleEmailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, email, sendDate }), // 使用 'message' 对应原始脚本的 'message'
            });
            const result = await response.json();
            if (response.ok) {
                statusMessage.textContent = result.message || '测试邮件已成功加入发送队列！将在1分钟后发送。';
                statusMessage.className = 'status-success';
                scheduleForm.reset(); 
                emailInput.disabled = false; // 允许重新输入邮箱进行下一次测试
                emailVerifiedCheckbox.checked = false;
                emailVerifiedLabel.textContent = '邮箱未验证';
                triggerVerificationModalButton.textContent = '点击验证邮箱';
                triggerVerificationModalButton.disabled = false;
            } else {
                statusMessage.textContent = result.error || '测试邮件发送失败，请稍后再试。';
                statusMessage.className = 'status-error';
            }
        } catch (error) {
            console.error('Error scheduling test email:', error);
            statusMessage.textContent = '请求失败，请检查网络连接或稍后再试。';
            statusMessage.className = 'status-error';
        }
    }

    if (sendVerificationCodeButton) {
        sendVerificationCodeButton.addEventListener('click', handleSendVerificationCode);
    }

    if (verifyCodeButton) {
        verifyCodeButton.addEventListener('click', handleVerifyCode);
    }

    function displayScheduledDateForTest() {
        if (!scheduledDateDisplay) return;

        // 这个函数现在会在页面加载时以及每次成功安排邮件后被调用
        // 为了在点击按钮时更新显示，我们可以在 handleScheduleEmail 成功后调用它
        // 或者，如果希望它在点击按钮的瞬间就更新（即使提交可能失败），
        // 可以在 handleScheduleEmail 的开头就计算好时间并更新显示。
        // 目前的逻辑是，它在页面加载时显示一个初始的10秒后时间。
        // 当邮件成功安排后，表单重置，这个函数可以被再次调用以更新显示（如果需要）。
        // 为了满足“点击按钮时的时间的10秒后”，我们将在 handleScheduleEmail 中更新这个显示。

        // 初始加载时，可以显示一个通用的提示
        scheduledDateDisplay.innerHTML = `邮件将在点击发送按钮后的1分钟发送。`;
        scheduledDateDisplay.className = 'status-info';
    }

    // 在 handleScheduleEmail 函数成功发送后更新显示
    async function handleScheduleEmail(event) {
        event.preventDefault();
        statusMessage.textContent = '正在处理请求...';
        statusMessage.className = 'status-message pending';

        if (!emailVerifiedCheckbox.checked) {
            statusMessage.textContent = '请点击“点击验证邮箱”按钮完成邮箱验证。';
            statusMessage.className = 'status-message error';
            if (verificationModal.style.display === 'none' && !emailInput.disabled) {
                triggerVerificationModalButton.focus(); 
            }
            return;
        }

        const message = selfMessageInput.value;
        const email = emailInput.value;

        if (!message) {
            statusMessage.textContent = '请填写自己想说的话。';
            statusMessage.className = 'status-error';
            return;
        }

        // 测试版本：发送时间设置为点击按钮时的时间的1分钟后
        const sendTime = new Date(Date.now() + 60000); // 60000毫秒 = 1分钟
        const sendDate = sendTime.toISOString();

        // 更新预计发送时间显示
        if (scheduledDateDisplay) {
            const year = sendTime.getFullYear();
            const month = String(sendTime.getMonth() + 1).padStart(2, '0');
            const day = String(sendTime.getDate()).padStart(2, '0');
            const hours = String(sendTime.getHours()).padStart(2, '0');
            const minutes = String(sendTime.getMinutes()).padStart(2, '0');
            const seconds = String(sendTime.getSeconds()).padStart(2, '0');
            scheduledDateDisplay.innerHTML = `邮件将在大约1分钟后发送。<br>预计发送时间：${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            scheduledDateDisplay.className = 'status-info';
        }

        if (!email) {
            statusMessage.textContent = '邮箱地址丢失，请刷新页面重试。';
            statusMessage.className = 'status-error';
            return;
        }

        try {
            const response = await fetch(scheduleEmailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, email, sendDate }), // 使用 'message' 对应原始脚本的 'message'
            });
            const result = await response.json();
            if (response.ok) {
                statusMessage.textContent = result.message || '测试邮件已成功加入发送队列！将在1分钟后发送。';
                statusMessage.className = 'status-success';
                scheduleForm.reset(); 
                emailInput.disabled = false; // 允许重新输入邮箱进行下一次测试
                emailVerifiedCheckbox.checked = false;
                emailVerifiedLabel.textContent = '邮箱未验证';
                triggerVerificationModalButton.textContent = '点击验证邮箱';
                triggerVerificationModalButton.disabled = false;
                displayScheduledDateForTest(); // 重置后再次调用以更新为通用提示
            } else {
                statusMessage.textContent = result.error || '测试邮件发送失败，请稍后再试。';
                statusMessage.className = 'status-error';
            }
        } catch (error) {
            console.error('Error scheduling test email:', error);
            statusMessage.textContent = '请求失败，请检查网络连接或稍后再试。';
            statusMessage.className = 'status-error';
        }
    }

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleEmail);
    }

    displayScheduledDateForTest(); // 显示测试的发送时间
    // 可以设置一个定时器来更新这个显示，如果需要的话
    // setInterval(displayScheduledDateForTest, 1000);
});