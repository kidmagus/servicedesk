import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import sass from 'sass';
import fileInclude from 'gulp-file-include';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import htmlmin from 'gulp-htmlmin';
import browserSyncPkg from 'browser-sync';
import { deleteAsync } from 'del';
import svgstore from 'gulp-svgstore';
import svgmin from 'gulp-svgmin';
import path from 'path';

const { src, dest, series, parallel, watch } = gulp;
const browserSync = browserSyncPkg.create();
const gulpSassCompiler = gulpSass(sass);

const paths = {
  html: {
    src: 'src/html/**/*.html',
    dest: 'dist/'
  },
  styles: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/js/**/*.js',
    dest: 'dist/js/'
  },
  images: {
    src: 'src/images/**/*',
    dest: 'dist/images/'
  },
  svg: {
    src: 'src/svg/icons/**/*.svg',  
    dest: 'dist/images/'            
  },
  bootstrap: {
    css: 'bootstrap-5.3.8-dist/css/bootstrap.min.css',
    js: 'bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js',
    destCss: 'dist/css/',
    destJs: 'dist/js/'
  }
};

// ─── Clean ───────────────────────────────────────────────────────────────────

export function clean() {
  return deleteAsync(['dist']);
}

// ─── HTML ────────────────────────────────────────────────────────────────────

export function html() {
  return src(paths.html.src)
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream());
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export function styles() {
  return src(paths.styles.src)
    .pipe(gulpSassCompiler().on('error', gulpSassCompiler.logError))
    .pipe(cleanCSS())
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

// ─── Scripts ─────────────────────────────────────────────────────────────────

export function scripts() {
  return src(paths.scripts.src)
    .pipe(uglify())
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

// ─── Images ──────────────────────────────────────────────────────────────────

export function images() {
  return src(paths.images.src, { allowEmpty: true, encoding: false })
    .pipe(dest(paths.images.dest));
}

// ─── SVG Sprites ─────────────────────────────────────────────────────────────

export function svg() {
  return src(paths.svg.src, { allowEmpty: true, encoding: false })
    .pipe(svgmin(function (file) {
      const prefix = path.basename(file.relative, path.extname(file.relative));
      return {
        plugins: [
          { name: 'cleanupIDs', params: { prefix: prefix + '-', minify: true } }
        ]
      };
    }))
    .pipe(svgstore({ inlineSvg: true })) 
    .pipe(dest(paths.svg.dest))
    .pipe(browserSync.stream());
}

// ─── Bootstrap Copy ──────────────────────────────────────────────────────────

export function bootstrap() {
  src(paths.bootstrap.css)
    .pipe(dest(paths.bootstrap.destCss));
  return src(paths.bootstrap.js)
    .pipe(dest(paths.bootstrap.destJs));
}

// ─── Serve ───────────────────────────────────────────────────────────────────

function serveTask() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    },
    port: 3000
  });
  watch(paths.html.src, html);
  watch(paths.styles.src, styles);
  watch(paths.scripts.src, scripts);
  watch(paths.images.src, images);
  watch(paths.svg.src, svg);    
  watch(paths.bootstrap.css, bootstrap);
  watch(paths.bootstrap.js, bootstrap);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const build = series(
  clean,
  parallel(html, styles, scripts, images, svg, bootstrap)
);

export const serve = series(build, serveTask);
export default build;
