import gulp from 'gulp';

const { src, dest } = gulp;

const paths = {
  bootstrap: {
    css: 'bootstrap-5.3.8-dist/css/bootstrap.min.css',
    js: 'bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js',
    destCss: 'dist/css/',
    destJs: 'dist/js/'
  }
};

export function bootstrap() {
  // Copy Bootstrap CSS
  src(paths.bootstrap.css)
    .pipe(dest(paths.bootstrap.destCss));
  // Copy Bootstrap JS
  return src(paths.bootstrap.js)
    .pipe(dest(paths.bootstrap.destJs));
}
