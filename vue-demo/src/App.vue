<script setup>
import { Pinchable } from "pinchable";
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

const images = [
    "https://picsum.photos/id/1015/400/600",
    "https://picsum.photos/id/1016/400/600",
    "https://picsum.photos/id/1024/400/600",
    "https://picsum.photos/id/1025/400/600",
    "https://picsum.photos/id/1035/400/600",
    "https://picsum.photos/id/1041/400/600",
];

const active = ref(null);
const closing = ref(false);
const imgRef = ref(null);

let pinch = null;
let unsubscribeEnd = null;
let closeTimer = null;

const cleanupPinch = () => {
    if (unsubscribeEnd) {
        unsubscribeEnd();
        unsubscribeEnd = null;
    }

    if (pinch) {
        pinch.dispose();
        pinch = null;
    }
};

const open = (index) => {
    if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
    }

    closing.value = false;
    active.value = index;
};

const close = () => {
    if (!closing.value) {
        closing.value = true;
    }
};

watch(closing, (value) => {
    if (value) {
        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
        }

        closeTimer = window.setTimeout(() => {
            active.value = null;
            closing.value = false;
        }, 500);
    } else if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
    }
});

watch(
    active,
    async (value) => {
        cleanupPinch();

        if (value === null) {
            return;
        }

        await nextTick();

        if (!imgRef.value) {
            return;
        }

        pinch = new Pinchable(imgRef.value, {
            maxZoom: 3,
            minZoom: 0.5,
            velocity: 0.7,
            applyTime: 400,
            nearZeroZoomThreshold: 0,
        });

        unsubscribeEnd = pinch.subscribe("end", (zoom) => {
            if (zoom < 0.7) {
                close();
                return;
            }

            if (zoom < 1) {
                pinch?.focus({ zoom: 1, to: { x: 0.5, y: 0.5 } });
            }
        });
    },
    { immediate: false }
);

onBeforeUnmount(() => {
    cleanupPinch();

    if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
    }
});
</script>

<template>
  <div>
    <h1>Click and pinch</h1>
    <span>
      Example for
      <a
        href="https://github.com/AlexanderShushunov/pinch"
        target="_blank"
        rel="noreferrer"
      >pinchable</a>
      lib
    </span>
    <div class="gallery">
      <img
        v-for="(src, index) in images"
        :key="src"
        :src="src"
        class="thumb"
        :alt="`Preview ${index + 1}`"
        @click="open(index)"
      >
    </div>
    <div
      v-if="active !== null"
      :class="['overlay', { closing }]"
    >
      <img
        ref="imgRef"
        :src="images[active]"
        :alt="`Full ${active + 1}`"
      >
      <button
        class="close-btn"
        type="button"
        @click="close"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 16px;
}

.thumb {
    width: 100%;
    height: auto;
    cursor: pointer;
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 1;
    transform: scale(1);
    transform-origin: center;
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.overlay.closing {
    opacity: 0;
    transform: scale(0.2);
}

.overlay img {
    max-width: 100%;
    max-height: 100%;
}

.close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
}
</style>
