import { Component, ElementRef, OnInit, ViewChild, PLATFORM_ID, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
// import { SlideService } from '../../services/slide.service';
// import { GoogleSlidesResponse, Slide } from '../../models/slide.interface';
// import * as SliderJson from '../../backup.json';
// import * as SliderJson from '../../google_slides_response.json'
// import { SlideModule } from '../../slide.module';
import { MatIconModule } from '@angular/material/icon';
import { constants } from 'node:buffer';
import { ShareComponent } from '../../../global/dialoge/share/share.component';
import { MatDialog } from '@angular/material/dialog';
import { S3DownloadService } from '../../../../services/s3-download.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DownloadPageService } from '../../../../services/download-page.service';
// import * as AWS from 'aws-sdk';
// Extend the Window interface to include animateSlides
declare global {
  interface Window {
    animates: () => void;
  }
}
interface Shape {
  shapeType: string;
  text: string;
  width: number;
  height: number;
  topOffset: number;
  leftOffset: number;
  backgroundColor: string;
  borderColor: string;
}
interface Slide {
  contentUrl: string;
  shapes: Shape[];
}

@Component({
  selector: 'app-slide',
  templateUrl: 'slide.component.html',
  styleUrls: ['slide.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class SlideComponent implements OnInit {
  @Input() sliderData: any;
  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private s3DownloadService: S3DownloadService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router,
    private downloadPageService: DownloadPageService
  ) { }

  @ViewChild('slidesContainer') slidesContainer!: ElementRef<HTMLDivElement>;
  slides: Slide[] = [];
  pageProperties: any[] = [];
  currentSlideIndex = 0;
  imagesLoaded: boolean[] = [];
  allImagesLoaded = false;
  mainTitle: any;
  // constructor(private slideService: SlideService) { }
  // sliderAllJsonData: any = SliderJson;
  sliderAllJsonData: any = '';
  imageLoadError: boolean[] = [];
  imageLoading: boolean[] = [];
  activeDesignPattern: string = 'leftRight';
  startScreen: boolean = true;
  showPopover: boolean = false;
  isLoading: boolean = true;

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params: Params) => {
      try {
        const presentationId = params['presentationId'];
        console.log('presentationId:', presentationId);

        if (!presentationId) {
          console.warn('No presentationId found in query parameters');
          this.snackBar.open('No presentationId found', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          this.router.navigate(['home']);
          return;
        } else {
          this.isLoading = true;
          await this.loadPresentationData(presentationId);
          this.processPresentationData();
          // let getLocalID = localStorage.getItem('localPresentationID');
          // if (getLocalID === presentationId) {
          //   this.sliderAllJsonData = localStorage.getItem('sliderJsonData');
          //   this.processPresentationData();           
          // } else {
          //   await this.loadPresentationData(presentationId);
          //   this.processPresentationData();
          // }
        }
      } catch (error) {
        console.error('Error in queryParams subscription:', error);
      }
    });
  }

  private async loadPresentationData(presentationId: string): Promise<void> {
    try {
      const jsonData = await this.s3DownloadService.getJsonFromS3(presentationId);
      if (!jsonData) {
        throw new Error('Empty response from S3');
      }
      this.sliderAllJsonData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      console.log('Downloaded JSON:', this.sliderAllJsonData);
    } catch (error) {
      console.error('Failed to fetch JSON:', error);
      throw error; // Re-throw to be caught by the outer handler
    }
  }

  private processPresentationData(): void {
    if (!this.sliderAllJsonData) {
      console.warn('No presentation data available to process');
      return;
    }
    // Only access localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      // document.documentElement.style.setProperty('--theme-demo-color', localStorage.getItem('themeColor') || '');
      console.log('Presentation JSON Data:', this.sliderAllJsonData);
      // Apply theme color from localStorage if available  
      document.documentElement.style.setProperty('--theme-demo-color', this.sliderAllJsonData?.themeColor);
      console.log('Theme color applied:', this.sliderAllJsonData?.themeColor);
      // return;
    }
    // Apply theme color
    // document.documentElement.style.setProperty('--theme-demo-color', localStorage.getItem('themeColor') || '');
    // Extract page dimensions
    const totalWidth = this.sliderAllJsonData?.pageSize?.width?.magnitude || 0;
    const totalHeight = this.sliderAllJsonData?.pageSize?.height?.magnitude || 0;
    this.pageProperties = this.sliderAllJsonData?.notesMaster?.pageProperties?.colorScheme?.colors;
    this.mainTitle = this.sliderAllJsonData?.title || '';

    // Process slides
    this.slides = this.sliderAllJsonData.slides
      .map((slide: any) => this.processSlide(slide, totalWidth, totalHeight))
      .filter((slide: Slide | null): slide is Slide => slide !== null);

    // Initialize loading states
    this.imagesLoaded = new Array(this.slides.length).fill(false);
    this.imageLoading = this.slides.map(() => true);
    this.imageLoadError = this.slides.map(() => false);

    // Schedule style updates
    setTimeout(() => this.updateMovementStyle(), 1000);
    this.isLoading = false; // Set loading to false after processing
  }

  private processSlide(slide: any, totalWidth: number, totalHeight: number): Slide | null {
    const image = slide.pageElements.find((element: any) => element.image);

    // Extract slide text
    let slideText = '';
    if (slide.slideProperties?.notesPage?.pageElements) {
      slide.slideProperties.notesPage.pageElements.forEach((element: any) => {
        if (element.shape?.text?.textElements) {
          element.shape.text.textElements.forEach((textElement: any) => {
            if (textElement?.textRun?.content) {
              slideText += textElement.textRun.content;
            }
          });
        }
      });
    }

    // Process shapes
    const shapes = slide.pageElements
      .filter((el: any) =>
        el.shape &&
        el.shape.shapeType &&
        !['TEXT_BOX', 'PLACEHOLDER', 'UNSPECIFIED'].includes(el.shape.shapeType) &&
        el.shape.shapeProperties?.propertyState !== 'NOT_RENDERED'
      )
      .map((shape: any) => {
        const shapeProperties = this.getElementPositionAndSize(
          shape.transform.translateX,
          shape.transform.translateY,
          shape.size.width.magnitude,
          shape.size.height.magnitude,
          shape.transform.scaleX,
          shape.transform.scaleY,
          totalWidth,
          totalHeight
        );

        return {
          shapeType: shape.shape.shapeType,
          text: slideText,
          width: shapeProperties.scaleXPercentage,
          height: shapeProperties.scaleYPercentage,
          topOffset: shapeProperties.translateYPercentage / 100,
          leftOffset: shapeProperties.translateXPercentage / 100,
          backgroundColor: shape?.shape?.shapeProperties?.shapeBackgroundFill?.solidFill?.color?.themeColor,
          borderColor: shape?.shape?.shapeProperties?.outline?.outlineFill?.color?.themeColor
        };
      });

    if (image && shapes.length > 0) {
      return {
        contentUrl: image.image.contentUrl,
        shapes: shapes
      };
    }
    return null;
  }
  isDownloadLoading: boolean = false;

  async downloadPresentation() {
    this.isDownloadLoading = true;
    try {
      await this.downloadPageService.downloadCurrentPage();
      console.log('Download completed');
      this.snackBar.open('Presentation downloaded successfully!', 'Close', {  
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      this.isDownloadLoading = false;
    }
  }
  // private async loadJsonFromS3(fileKey: string) {
  //   try {
  //     const jsonData = await this.getJsonFromS3(
  //       'snwz-google-slides-app',
  //       fileKey
  //     );
  //     console.log('Retrieved JSON data:', jsonData);
  //     // Process your JSON data here
  //   } catch (error) {
  //     console.error('Error fetching JSON from S3:', error);
  //   }
  // }

  // private async getJsonFromS3(bucket: string, key: string): Promise<any> {
  //   // Configure AWS SDK
  //   AWS.config.update({
  //     region: 'us-west-1',
  //     accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
  //     secretAccessKey: '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',
  //   });

  //   const s3 = new AWS.S3();

  //   const params = {
  //     Bucket: bucket,
  //     Key: key
  //   };

  //   try {
  //     const data = await s3.getObject(params).promise();
  //     if (data.Body) {
  //       return JSON.parse(data.Body.toString('utf-8'));
  //     }
  //     throw new Error('Empty response body from S3');
  //   } catch (error) {
  //     console.error('S3 getObject error:', error);
  //     throw error;
  //   }
  // }
  // upper side code for json persor
  activeDetailsTitle: any;
  getShapeDetails(shapeDetails: Shape) {
    return shapeDetails;
  }
  activeDesignPatternMode(designPattern: any) {
    this.activeDesignPattern = designPattern;
    this.showPopover = false;
    setTimeout(() => {
      this.updateMovementStyle();
      this.showPopover = true; // Show after update
    }, 500);
  }
  // onImageLoad(index: number) {
  //   this.imageLoading[index] = false;
  //   this.imageLoadError[index] = false;
  // }
  shareDemoLink() {
    const dialogRef = this.dialog.open(ShareComponent, {
      width: '400px',
      data: {
        title: 'Share Presentation',
        message: 'Share this presentation with others.',
        url: window.location.href
      }
    });
  }
  loadedImagesCount = 0;
  onImageLoad(index: number) {
    this.imageLoading[index] = false;
    this.imageLoadError[index] = false;
    this.loadedImagesCount++;

    // Only set allImagesLoaded when all images have finished loading
    if (this.loadedImagesCount === this.slides.length) {
      setTimeout(() => {
        this.allImagesLoaded = true;
      }, 500); // Small delay to ensure DOM updates
    }
  }

  onImageError(index: number) {
    this.imageLoading[index] = false;
    this.imageLoadError[index] = true;
  }
  startSlide() {
    this.startScreen = false;
    this.updateHotspots();
  }

  getElementPositionAndSize(
    translateX: number,
    translateY: number,
    scaleX: number,
    scaleY: number,
    widthEMU: number,
    heightEMU: number,
    slideWidthEMU: number = 9144000,
    slideHeightEMU: number = 6858000
  ) {
    const {
      translateXPercentage,
      translateYPercentage,
      scaleXPercentage,
      scaleYPercentage
    } = convertTransform(translateX, translateY, scaleX, scaleY, widthEMU, heightEMU, slideWidthEMU, slideHeightEMU);

    return {
      translateXPercentage,
      translateYPercentage,
      scaleXPercentage,
      scaleYPercentage
    };
  }

  getColorByType(type: any) {
    const item = this.pageProperties.find(element => element.type === type);
    return item ? item.color : null;
  }
  colorToRgb(color: any, alpha: number = 1) {
    if (!color) return 'rgba(0, 0, 0, 0)'; // Return transparent if color is null/undefined
    if (color.red !== undefined && color.green !== undefined && color.blue !== undefined) {
      const red = Math.round(color.red * 255);
      const green = Math.round(color.green * 255);
      const blue = Math.round(color.blue * 255);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
    return 'rgba(0, 0, 0, 0)'; // Return transparent as fallback
  }

  getShapeStyle(shape: Shape) {
    // const borderColor = this.getColorByType(shape.borderColor);
    // const backgroundColor = this.getColorByType(shape.backgroundColor);

    // return {
    //   width: `${shape.width}%`,
    //   height: `${shape.height}%`,
    //   top: `${shape.topOffset * 100}%`,
    //   left: `${shape.leftOffset * 100}%`,
    //   borderColor: '#ff0000',
    //   backgroundColor: this.colorToRgb(backgroundColor, 0.5),
    //   position: 'absolute',
    //   borderStyle: 'solid',
    //   borderWidth: '4px',
    //   borderRadius: '8px',
    // };
    // debugger;
    // const borderColor = this.getColorByType(shape.borderColor);
    // const backgroundColor = this.getColorByType(shape.backgroundColor);
    // const isCurrentSlide = this.slides[this.currentSlideIndex].shapes.includes(shape);
    const borderColor = this.getColorByType(shape.borderColor) || { red: 0, green: 0, blue: 0 };
    const backgroundColor = this.getColorByType(shape.backgroundColor) || { red: 0, green: 0, blue: 0 };
    const isCurrentSlide = this.slides[this.currentSlideIndex].shapes.includes(shape);

    const baseStyles = {
      width: `${shape.width}%`,
      height: `${shape.height}%`,
      top: `${shape.topOffset * 100}%`,
      left: `${shape.leftOffset * 100}%`,
      borderColor: borderColor,
      backgroundColor: this.colorToRgb(backgroundColor, 0.5),
      borderStyle: 'solid',
      borderWidth: '1px',
    };
    const leftValue = parseFloat(`${shape.leftOffset * 100}%`);
    const widthValue = parseFloat(`${shape.width}%`);
    // setTimeout(() => {
    this.currentPopoverStyle = {
      top: `${shape.topOffset * 100}%`,
      opacity: '1',
      left: `${leftValue + (widthValue / 2)}%`  // Convert to percentage
    };
    // }, 1000);
    // this.currentPopoverStyle= {
    //   top: `${shape.topOffset * 100}%`,
    //   left: `calc(${shape.leftOffset * 100} + (${shape.width}% / 2))`,
    // }


    if (isCurrentSlide) {
      return {
        ...baseStyles,
        // opacity: 1,
        // transform: 'scale(1)',
        zIndex: 2
      };
    } else {
      return {
        ...baseStyles,
        // opacity: 0.5,
        // transform: 'scale(0.95)',
        zIndex: 1
      };
    }
  }

  // animateSlides() {
  //   window.animates();
  // }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.updateHotspots();
    }
  }

  nextSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
    } else {
      this.currentSlideIndex = 0;
    }
    this.updateHotspots();
  }
  currentHotspotStyle: any = {};
  currentPopoverStyle: any = {};
  setScale(shape: any) {
    const scaleContainer = document.querySelector('.scale_container') as HTMLElement;
    const movementHotspot = document.querySelector('.movement_hotspot') as HTMLElement;

    if (scaleContainer && movementHotspot) {
      scaleContainer.style.transform = 'scale(1)';

      const topPercent = shape.topOffset * 100;
      const leftPercent = shape.leftOffset * 100;

      // Set transform origin based on hotspot position
      if (topPercent <= 33) {
        if (leftPercent <= 33) {
          scaleContainer.style.transformOrigin = 'top left';
        } else if (leftPercent <= 66) {
          scaleContainer.style.transformOrigin = 'top center';
        } else {
          scaleContainer.style.transformOrigin = 'top right';
        }
      } else if (topPercent > 66) {
        if (leftPercent <= 33) {
          scaleContainer.style.transformOrigin = 'bottom left';
        } else if (leftPercent <= 66) {
          scaleContainer.style.transformOrigin = 'bottom center';
        } else {
          scaleContainer.style.transformOrigin = 'bottom right';
        }
      } else {
        if (leftPercent <= 33) {
          scaleContainer.style.transformOrigin = 'center left';
        } else if (leftPercent <= 66) {
          scaleContainer.style.transformOrigin = 'center center';
        } else {
          scaleContainer.style.transformOrigin = 'center right';
        }
      }

      // Apply scale transform
      scaleContainer.style.transform = 'scale(1.15)';
      // scaleContainer.style.transition = 'transform 0.5s ease, transform-origin 0.5s ease';
    }
  }
  updateHotspots() {
    this.showPopover = false;
    this.slides = [...this.slides];
    this.updateActiveSlide();
    // Force change detection and update active slide
    // setTimeout(() => {

    // }, 0);
    // setTimeout(() => {
    //   const shapes = this.slides[this.currentSlideIndex].shapes;
    //   shapes.forEach(shape => {
    //     this.getShapeStyle(shape);
    //   });
    //   // Trigger DOM update for active slide     
    // }, 500);

    setTimeout(() => {
      const currentSlideHotspot = document.querySelector('.active_slide .hotspot');
      if (currentSlideHotspot) {
        const currentShape = this.slides[this.currentSlideIndex].shapes[0];
        this.setScale(currentShape);
      }
      this.showPopover = true;
    }, 1000);
    this.updateMovementStyle();
  }

  computedWidth: any;
  updateMovementStyle() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const currentSlideHotspot = document.querySelector('.active_slide .hotspot');
        // const currentSlidePopoverActive = document.querySelector('.active_slide');
        // this.currentSlidePopoverActive = {
        //   opacity: '1',
        // };
        // const allPopovers = document.querySelectorAll('.popover_container');

        // First, hide all popovers
        // allPopovers.forEach(popover => {
        //   (popover as HTMLElement).style.opacity = '0';
        //   (popover as HTMLElement).style.pointerEvents = 'none';
        // });
        // debugger;
        if (currentSlideHotspot) {
          // alert(currentSlideHotspot);
          const computedStyle = window.getComputedStyle(currentSlideHotspot);
          this.computedWidth = computedStyle.width;
          console.log('Computed Style:', computedStyle.width);
          this.currentHotspotStyle = {
            width: computedStyle.width,
            height: computedStyle.height,
            top: computedStyle.top,
            left: computedStyle.left,
            borderColor: computedStyle.borderColor,
            backgroundColor: computedStyle.backgroundColor,
            // borderStyle: computedStyle.borderStyle,
            borderWidth: computedStyle.borderWidth,
            borderRadius: computedStyle.borderRadius,
            transform: computedStyle.transform,
            opacity: '1',
          };
          // this.currentPopoverStyle= {
          //   top: computedStyle.top,
          //   left: `calc(${computedStyle.left} + (${computedStyle.width}% / 2))`,
          // }
          const leftValue = parseFloat(computedStyle.left);
          const widthValue = parseFloat(computedStyle.width);
          // debugger;
          currentSlideHotspot
          this.currentPopoverStyle = {
            top: computedStyle.top,
            left: `${leftValue + (widthValue / 2)}%`,
            opacity: '1'
          };

          // Add delay before showing
          // setTimeout(() => {
          //   this.currentPopoverStyle = {
          //     ...this.currentPopoverStyle,
          //     opacity: '1'
          //   };
          // }, 1000);
          // this.currentPopoverStyle = {
          //   top: computedStyle.top,
          //   opacity: '1',
          //   left: `${leftValue + (widthValue / 2)}%`  // Convert to percentage
          // };
        }
      }, 100);
    }
  }

  updateActiveSlide() {
    const slideBlocks = document.querySelectorAll('.slide_block');
    slideBlocks.forEach((block, index) => {
      if (index === this.currentSlideIndex) {
        block.classList.add('active_slide');
      } else {
        block.classList.remove('active_slide');
      }
    });
  }

  getPopoverPosition(shape: any): string {
    // Get the shape's position relative to the viewport
    const shapeLeft = shape.leftOffset * 100;
    const shapeTop = shape.topOffset * 100;

    // Default to top position
    let position = 'position-top';

    // If too close to top, show below
    if (shapeTop < 20) {
      position = 'position-bottom';
    }
    // If too close to bottom, show above
    else if (shapeTop > 80) {
      position = 'position-top';
    }
    // If too close to left, show on right
    else if (shapeLeft < 20) {
      position = 'position-right';
    }
    // If too close to right, show on left
    else if (shapeLeft > 80) {
      position = 'position-left';
    }

    return position;
  }

  resetSlider() {
    this.currentSlideIndex = 0;
    const scaleContainer = document.querySelector('.scale_container') as HTMLElement;
    scaleContainer.style.transform = 'scale(1)';
    scaleContainer.style.transformOrigin = 'center center';
    this.updateHotspots();
    this.startScreen = true;
    this.showPopover = false;
  }
}

function convertTransform(translateX: number, translateY: number, scaleX: number, scaleY: number, widthEMU: number, heightEMU: number, slideWidthEMU: number, slideHeightEMU: number) {

  const EMU_TO_PIXELS = 1; // 1 EMU = 0.0072 pixels

  // const viewportSize = getViewportDimensions();

  // const viewportWidthPercentage = convertPixelsToPercentage(viewportSize.width, viewportSize.width);
  // const viewportHeightPercentage = convertPixelsToPercentage(viewportSize.height, viewportSize.height);

  const widthPixels = widthEMU * EMU_TO_PIXELS;
  const heightPixels = heightEMU * EMU_TO_PIXELS;
  const translateXPixels = translateX * EMU_TO_PIXELS;
  const translateYPixels = translateY * EMU_TO_PIXELS;

  const slideWidthPixels = slideWidthEMU * EMU_TO_PIXELS;
  const slideHeightPixels = slideHeightEMU * EMU_TO_PIXELS;

  const scaleXPixels = scaleX * widthPixels;
  const scaleYPixels = scaleY * heightPixels;

  const translateXPercentage = (translateXPixels / slideWidthPixels) * 100;
  const translateYPercentage = (translateYPixels / slideHeightPixels) * 100;

  const scaleXPercentage = (scaleXPixels / slideWidthPixels) * 100;
  const scaleYPercentage = (scaleYPixels / slideHeightPixels) * 100;

  return {
    translateXPercentage,
    translateYPercentage,
    scaleXPercentage,
    scaleYPercentage
  };
}

function getViewportDimensions() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  return {
    width: width,
    height: height
  };
}

function convertPixelsToPercentage(valueInPixels: number, totalPixels: number): number {
  return (valueInPixels / totalPixels) * 100;
}
