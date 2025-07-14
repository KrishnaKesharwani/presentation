const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

const animates = async () => {
  const slides = document.querySelectorAll('.slide-container');
  console.log(slides);
  for (let i = 0; i < slides.length; i++) {
    // await sleep(3);
    // window.scrollTo({
    //   top: window.innerHeight * i,
    //   behavior: 'smooth'
    // });
    await sleep(2);
    await animate(slides[i]);
  }
};

const animate = async (slide) => {
  const shapes = slide.querySelectorAll('.shape');
  const image = slide.querySelectorAll('.slide-image');
  for (const shape of shapes) {
    shape.classList.remove('hidden-shape');
    shape.classList.add('visible-shape');
    await sleep(2); 
    anime({
      targets: image,
      scale: 1.3,
      transformOrigin: "0% 50%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    anime({
      targets: shape,
      top: "37%",
      left: "0.5%",
      height: "9%",
      width: "15%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    await sleep(3);
    anime({
      targets: image,
      scale: 1,
      transformOrigin: "0% 50%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    anime({
      targets: shape,
      top: "71%",
      left: "33.5%",
      height: "14%",
      width: "15%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    await sleep(4);
    anime({
      targets: image,
      scale: 1.3,
      transformOrigin: "50% 0%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    anime({
      targets: shape,
      top: "20%",
      left: "29%",
      height: "22%",
      width: "21%",
      duration: 1000,
      easing: "easeOutCubic",
    });
    await sleep(3);
    anime({
      targets: image,
      scale: 1,
      duration: 1000,
      easing: "easeOutCubic",
    });
    anime({
      targets: shape,
      top: "15%",
      left: "33.8%",
      height: "20%",
      width: "18%",
      duration: 1000,
      easing: "easeOutCubic",
    });
  }
};

window.onload = () => {
  window.scrollTo(0, 0);
  window.animates();
};

window.animates = animates;
