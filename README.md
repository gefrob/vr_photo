View 3d, flat and 360 photos in VR.

On chrome for android, you need to set an experimental flag `chrome://flags#enable-webvr`  
Look at the arrows below the image to navigate.  

To add your own images edit src/images.js
Add flat or 3d pictures and use default parameters.

```
{
  image: "./images/photo.jpg"
}
```


```
{
  image: {
    left: "./images/left.jpg"
    right: "./images/right.jpg"
  }
}
```

Set size of the plane. If only width or height specified missing parameter would be calculated based on the ratio between PixelXDimension and PixelYDimension, EXIF orientation is taken into account.

```
{
  image: "./images/photo.jpg"
  height: 1
}
```

```
{
  image: {
    left: "./images/left.jpg"
    right: "./images/right.jpg"
  },
  width: 1.33,
  height: 1
}
```

Photos containing a GPano XML tag will be mapped onto a sphere.
