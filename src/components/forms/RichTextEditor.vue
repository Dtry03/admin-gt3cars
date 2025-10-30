<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-white mb-1">
      {{ label }}
    </label>
    
    <div v-if="editor" class="flex items-center space-x-1 border-4 border-secondary rounded-t-md p-2 bg-shadow">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="p-1 rounded hover:bg-primary text-white"
      >
        <BoldIcon class="h-5 w-5" />
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="p-1 rounded hover:bg-primary text-white"
      >
        <ItalicIcon class="h-5 w-5" />
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        class="p-1 rounded hover:bg-primary text-white"
      >
        <StrikethroughIcon class="h-5 w-5" />
      </button>
       <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        class="p-1 rounded hover:bg-primary text-white"
      >
        <ListBulletIcon class="h-5 w-5" />
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        class="p-1 rounded hover:bg-primary text-white"
      >
        <Bars3BottomLeftIcon class="h-5 w-5" />
      </button>
    </div>
    
    <editor-content 
      :editor="editor" 
      class="prose max-w-none p-3 border-4 border-t-0 border-secondary rounded-b-md min-h-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch } from 'vue'

// Importar iconos (o usar texto)

import { 
  BoldIcon, 
  ItalicIcon, 
  StrikethroughIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon
} from '@heroicons/vue/24/solid'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[150px]',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Sincronizar el contenido si cambia desde fuera
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

// Estilo para botones activos
</script>

<style>
/* Estilos para TipTap */
.prose {
  /* Tailwind prose defaults */
}
.ProseMirror:focus {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
.is-active {
  background-color: #e5e7eb; /* bg-primary */
  color: #059669; /* text-primary */
}
</style>