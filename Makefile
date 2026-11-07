.PHONY: deps start check build serve deploy clean distclean help

help:
	@echo "Xterm Web Serial Terminal"
	@echo "=========================="
	@echo "  make deps      - Install dependencies"
	@echo "  make start     - Start the development server"
	@echo "  make check     - Check JavaScript source"
	@echo "  make build     - Build the production website"
	@echo "  make serve     - Preview the production build"
	@echo "  make deploy    - Trigger the GitHub Pages workflow"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make distclean - Remove artifacts and dependencies"

deps:
	npm install

start: deps
	npm run dev

check: deps
	npm run check

build: deps
	npm run build

serve: build
	npm run preview

deploy:
	gh workflow run deploy.yml

clean:
	rm -rf dist

distclean: clean
	rm -rf node_modules package-lock.json
