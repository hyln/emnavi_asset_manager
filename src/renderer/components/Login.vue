<template>
    <div>
        <div style="color: #000; margin-top: 0.5em; font-size: 1.5em;">请输入6位数字口令</div>
        <div style="height: 1.5em;"></div>

        <div>
            <input
            v-for="(digit, idx) in digits"
            :key="idx"
            ref="inputs"
            maxlength="1"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            v-model="digits[idx]"
            @input="onInput(idx, $event)"
            @keydown.backspace="onBackspace(idx, $event)"
            style="width: 1.2em; height: 1.2em; font-size: 1.5em; text-align: center; margin-right: 0.5em; border-radius: 0.3em;"
            />
        </div>
        <!-- <div style="height: 1.5em;"></div> -->
        <div v-if="error" style="color: red;">{{ error }}</div>
        </div>
    </template>

    <script setup>
    import { ref, watch, nextTick } from 'vue'
    import { ElMessage } from 'element-plus'

    const digits = ref(Array(6).fill(''))
    const error = ref('')

    const inputs = ref([])
    const isLogin = ref(false)
    const emit = defineEmits(['isLogin'])

    function onInput(idx, event) {
        const val = event.target.value.replace(/\D/g, '')
        digits.value[idx] = val
        if (val && idx < 5) {
        focusInput(idx + 1)
        }
        // 自动登录
        if (digits.value.every(d => d.length === 1)) {
        login()
        }
    }

    function onBackspace(idx, event) {
        if (!digits.value[idx] && idx > 0) {
        focusInput(idx - 1)
        }
    }

    function focusInput(idx) {
        nextTick(() => {
        if (inputs.value[idx]) {
            inputs.value[idx].focus()
        }
        })
    }

    function login() {
        const code = digits.value.join('')
        window.electronAPI.requestAuth(code).then(result => {
            console.log(result);
            if (result && result.success) {
                error.value = ''
                // 登录成功逻辑
                emit('isLogin', true);

                ElMessage.success('登录成功')
            } else {
                error.value = (result && result.message) ? result.message : '口令错误，请重试'
                digits.value = Array(6).fill('')
                focusInput(0)
            }
        }).catch(() => {
            error.value = '认证失败，请重试'
            digits.value = Array(6).fill('')
            focusInput(0)
        })
    }

    // 自动聚焦第一个输入框
    nextTick(() => {
        focusInput(0)
    })


    import { onMounted } from 'vue'

    onMounted(() => {
        window.electronAPI.checkIsLogin().then(isLogin => {
            if (isLogin) {
                ElMessage.success('已登录')
                emit('isLogin', true);

                // 可以在这里跳转到主页面或执行其他操作
            }
        })
    })
    </script>
