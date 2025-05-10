// 定时寄出邮件功能

document.addEventListener('DOMContentLoaded', () => {
    const scheduleForm = document.getElementById('schedule-form');
    const statusMessage = document.getElementById('status-message');
    const emailInput = document.getElementById('email');
    const emailVerifiedCheckbox = document.getElementById('email-verified-checkbox');
    const emailVerifiedLabel = document.getElementById('email-verified-label');
    const selfMessageInput = document.getElementById('self-message');
    // const sendDateInput = document.getElementById('send-date'); // Removed
    const sendButton = document.getElementById('send-btn');
    const scheduledDateDisplay = document.getElementById('scheduled-date-display'); // New element to display date
    
    // Modal elements
    const verificationModal = document.getElementById('verification-modal');
    const triggerVerificationModalButton = document.getElementById('trigger-verification-modal');
    const closeVerificationModalButton = document.getElementById('close-verification-modal');
    const modalEmailDisplay = document.getElementById('modal-email-display');
    const sendVerificationCodeButton = document.getElementById('send-verification-code'); // Inside modal
    const verificationCodeInput = document.getElementById('verification-code'); // Inside modal
    const verifyCodeButton = document.getElementById('verify-code'); // Inside modal
    const verificationStatus = document.getElementById('verification-status'); // Inside modal

    // QQ Login Modal elements (for mobile)
    const qqLoginLinkMobile = document.querySelector('.email-provider-link[href*="mail.qq.com"]'); // More specific selector
    const qqLoginModalMobile = document.getElementById('qq-login-modal-mobile');
    const closeQQLoginModalMobile = document.getElementById('close-qq-login-modal-mobile');
    const qqLoginConfirmBtnMobile = document.getElementById('qq-login-confirm-btn-mobile');
    const qqLoginCancelBtnMobile = document.getElementById('qq-login-cancel-btn-mobile');

    // Cloudflare Worker 的 URL
    const baseWorkerUrl = 'https://pxt1.sanyi.us.kg';
    const sendVerificationEmailUrl = `${baseWorkerUrl}/send-verification-email`;
    const verifyEmailUrl = `${baseWorkerUrl}/verify-email`;
    const scheduleEmailUrl = `${baseWorkerUrl}/schedule-email`;

    // Event listener for triggering the modal
    if (triggerVerificationModalButton) {
        triggerVerificationModalButton.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                statusMessage.textContent = '请输入有效的邮箱地址后再进行验证。';
                statusMessage.className = 'status-message error';
                emailInput.focus();
                return;
            }
            modalEmailDisplay.textContent = email; // Display current email in modal
            verificationModal.style.display = 'block';
            verificationStatus.textContent = ''; // Clear previous modal status
        });
    }

    // Event listener for QQ Login link on mobile
    if (qqLoginLinkMobile && qqLoginModalMobile) {
        qqLoginLinkMobile.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            qqLoginModalMobile.style.display = 'block';
        });
    }

    // Event listener for closing QQ Login modal on mobile
    if (closeQQLoginModalMobile) {
        closeQQLoginModalMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    // Event listener for QQ Login confirm button on mobile
    if (qqLoginConfirmBtnMobile) {
        qqLoginConfirmBtnMobile.addEventListener('click', () => {
            window.open('https://mail.qq.com', '_blank');
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    // Event listener for QQ Login cancel button on mobile
    if (qqLoginCancelBtnMobile) {
        qqLoginCancelBtnMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    // Event listener for closing the modal
    if (closeVerificationModalButton) {
        closeVerificationModalButton.addEventListener('click', () => {
            verificationModal.style.display = 'none';
        });
    }

    // Event listener for QQ Login link on mobile
    if (qqLoginLinkMobile && qqLoginModalMobile) {
        qqLoginLinkMobile.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            qqLoginModalMobile.style.display = 'block';
        });
    }

    // Event listener for closing QQ Login modal on mobile
    if (closeQQLoginModalMobile) {
        closeQQLoginModalMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    // Event listener for QQ Login confirm button on mobile
    if (qqLoginConfirmBtnMobile) {
        qqLoginConfirmBtnMobile.addEventListener('click', () => {
            window.open('https://mail.qq.com', '_blank');
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
        });
    }

    // Event listener for QQ Login cancel button on mobile
    if (qqLoginCancelBtnMobile) {
        qqLoginCancelBtnMobile.addEventListener('click', () => {
            if (qqLoginModalMobile) qqLoginModalMobile.style.display = 'none';
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
                headers: {
                    'Content-Type': 'application/json',
                },
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
            verificationStatus.textContent = '请输入邮箱和验证码（！也要）。';
            verificationStatus.className = 'status-error';
            return;
        }

        verificationStatus.textContent = '正在验证...';
        verificationStatus.className = 'status-pending';

        try {
            const response = await fetch(verifyEmailUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code }),
            });
            const result = await response.json();
            if (response.ok) {
                verificationStatus.textContent = result.message || '邮箱验证成功！';
                verificationStatus.className = 'status-message success';
                emailVerifiedCheckbox.checked = true;
                // emailVerifiedCheckbox.disabled = false; // Checkbox remains disabled but visually checked
                emailVerifiedLabel.textContent = '邮箱已验证';
                emailInput.disabled = true; // Disable main email input
                triggerVerificationModalButton.textContent = '邮箱已验证';
                triggerVerificationModalButton.disabled = true;
                verificationModal.style.display = 'none'; // Close modal on success
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
            // Optionally, re-open the modal or highlight the verification trigger
            if (verificationModal.style.display === 'none' && !emailInput.disabled) {
                triggerVerificationModalButton.focus(); 
            }
            return;
        }

        const message = selfMessageInput.value;
        const email = emailInput.value; // Email is disabled, but value is still accessible

        if (!message) {
            statusMessage.textContent = '请填写自己想说的话。';
            statusMessage.className = 'status-error';
            return;
        }

        // Retrieve the pre-calculated solar date from the form's dataset
        const targetSolarYear = scheduleForm.dataset.targetSolarYear;
        const targetSolarMonth = scheduleForm.dataset.targetSolarMonth;
        const targetSolarDay = scheduleForm.dataset.targetSolarDay;

        if (!targetSolarYear || !targetSolarMonth || !targetSolarDay) {
            statusMessage.textContent = '无法获取预定的发送日期，请刷新页面重试。';
            statusMessage.className = 'status-error';
            console.error('Target solar date not found in form dataset.');
            return;
        }

        // Construct the date string for the beginning of the day in UTC
        // Month is 1-indexed from dataset, but 0-indexed for JavaScript Date's month argument
        // Target: Send at Beijing Time (UTC+8) YYYY-MM-DD 00:00:00.
        // This means the equivalent UTC time is YYYY-MM-DD 00:00:00 minus 8 hours.
        const targetBeijingMidnightAsUTC = new Date(Date.UTC(parseInt(targetSolarYear), parseInt(targetSolarMonth) - 1, parseInt(targetSolarDay), 0, 0, 0));
        // Subtract 8 hours to get the UTC time that corresponds to Beijing midnight
        targetBeijingMidnightAsUTC.setUTCHours(targetBeijingMidnightAsUTC.getUTCHours() - 8);
        const sendDate = targetBeijingMidnightAsUTC.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ

        if (!email) { // 再次检查 email，理论上不应该为空
            statusMessage.textContent = '邮箱地址丢失，请刷新页面重试。';
            statusMessage.className = 'status-error';
            return;
        }

        // No need to re-check message and email here as it's done above and sendDate is now derived

        try {
            const response = await fetch(scheduleEmailUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, email, sendDate }),
            });

            const result = await response.json();

            if (response.ok) {
                statusMessage.textContent = result.message || '邮件已成功加入发送队列！';
                statusMessage.className = 'status-success';
                scheduleForm.reset(); // 清空表单
            } else {
                statusMessage.textContent = result.error || '邮件发送失败，请稍后再试。';
                statusMessage.className = 'status-error';
            }
        } catch (error) {
            console.error('Error scheduling email:', error);
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

    function displayScheduledDate() {
        if (!scheduledDateDisplay) return;

        const displaySolarDate = "2026年5月29日";
        const displayLunarDate = "2026年 农历四月十三"; // Simplified display

        scheduledDateDisplay.innerHTML = `预计送达日期：<br>公历 ${displaySolarDate}<br>农历 ${displayLunarDate}`;
        scheduledDateDisplay.className = 'status-info'; // Use a neutral class

        // Store the fixed solar date for submission
        if (scheduleForm) {
            scheduleForm.dataset.targetSolarYear = "2026";
            scheduleForm.dataset.targetSolarMonth = "5";
            scheduleForm.dataset.targetSolarDay = "29";
        }
    }

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleEmail);
    }

    // Display the default scheduled date on page load
    displayScheduledDate();

    // If email input changes, and it's valid, re-calculate/display date (optional, good UX)
    // For now, we'll just display it once on load.
});

// Helper function to format date as YYYY-MM-DD
function formatDate(year, month, day) { // Changed to accept year, month, day
    let m = '' + month;
    let d = '' + day;

    if (m.length < 2) 
        m = '0' + m;
    if (d.length < 2) 
        d = '0' + d;

    return [year, m, d].join('-');
}