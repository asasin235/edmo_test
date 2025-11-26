<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Type your message...'
  }
});

const emit = defineEmits(['update:modelValue', 'send']);

const inputRef = ref(null);

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('send');
  }
}

function handleInput(event) {
  emit('update:modelValue', event.target.value);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="text-input-wrapper">
    <textarea
      ref="inputRef"
      class="text-input"
      :value="modelValue"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
      rows="1"
    ></textarea>
    <button 
      class="send-button"
      :disabled="disabled || !modelValue.trim()"
      @click="$emit('send')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" x2="11" y1="2" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.text-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  transition: all 0.3s ease;
}

.text-input-wrapper:focus-within {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.text-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 15px;
  line-height: 1.5;
  padding: 8px 0;
  resize: none;
  outline: none;
  font-family: inherit;
}

.text-input::placeholder {
  color: #64748b;
}

.text-input:disabled {
  opacity: 0.5;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.send-button:active:not(:disabled) {
  transform: scale(0.95);
}

.send-button:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.5;
}
</style>

