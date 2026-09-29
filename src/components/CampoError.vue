<template>
  <p v-if="mensaje" class="campo-error" role="alert">{{ mensaje }}</p>
</template>

<script setup lang="ts">
defineProps<{ mensaje?: string }>();
</script>

<style scoped>
.campo-error {
  color: var(--ion-color-danger);
  font-size: 0.875rem;
  margin: 4px 4px 0;
}
</style>
