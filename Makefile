# defaults
src := build
target := gh-pages
message := Release: $(shell date)

.PHONY: pages dist deploy

dist:
	@mkdir -p dist/play dist/runtime dist/compiler
	@cp -r site/. dist/
	@cp -r playground/. dist/play/
	@cp -r runtime/. dist/runtime/
	@cp -r compiler/. dist/compiler/
	@echo "nixrc.dev" > dist/CNAME

pages:
	@(git worktree remove $(src) --force > /dev/null 2>&1) || true
	@git worktree add $(src) $(target)
	@cd $(src) && rm -rf *
	@make -s dist
	@cp -r dist/* $(src)

deploy:
	@cd $(src) && git add . && git commit -m "$(message)"
	@git push origin $(target) -f
