#!/bin/sh

TARGET_DIR=node_modules

if [ ! -d $TARGET_DIR ]; then
	echo "$TARGET_DIR" does not exist
	exit 1
fi

PATTERNS="
__tests__
_config.yml
.*ignore
.babel*
.circle*
.documentup*
.ds_store
.editorconfig
.env*
.git*
.idea
.lint*
.npm*
.nyc*
.prettier*
.tern-project
.yarn-integrity
.yarn-metadata.json
.yarnclean
.yo-*
*.coffee
*.flow*
*.jst
*.markdown
*.md
*.mkd
*.swp
*.tgz
*appveyor*
*coveralls*
*eslint*
*htmllint*
*jshint*
*readme*
*stylelint*
*travis*
*tslint*
*vscode*
*wallaby*
authors
changelog
changes
circle.yml
component.json
contributors
coverage
doc
docs
example
examples
grunt*
gulp*
jenkins*
jest.config.*
jsconfig.json
karma.conf*
licence
licence.txt
license
license.txt
makefile
npm-debug.log
powered-test
prettier.*
test
tests
tsconfig.json
Jenkinsfile
Makefile
Gulpfile.js
Gruntfile.js
gulpfile.js
.DS_Store
.gitattributes
.eslintrc
eslint
.eslintrc.js
.eslintrc.json
.eslintrc.yml
.eslintignore
.stylelintrc
stylelint.config.js
.stylelintrc.json
.stylelintrc.yaml
.stylelintrc.yml
.stylelintrc.js
.htmllintrc
htmllint.js
.lint
.npmrc
.npmignore
.jshintrc
.flowconfig
.documentup.json
.yarn-metadata.json
.travis.yml
appveyor.yml
.gitlab-ci.yml
.coveralls.yml
CHANGES
LICENSE.txt
LICENSE
LICENSE-MIT
LICENSE.BSD
licence
LICENCE.txt
LICENCE
LICENCE-MIT
LICENCE.BSD
licence
AUTHORS
CONTRIBUTORS
.yarn-integrity
.yarnclean
_config.yml
.babelrc
.yo-rc.json
jest.config.js
karma.conf.js
wallaby.js
wallaby.conf.js
.prettierrc
.prettierrc.yml
.prettierrc.toml
.prettierrc.js
.prettierrc.json
prettier.config.js
.appveyor.yml
tsconfig.json
tslint.json
__tests__
test
tests
powered-test
docs
doc
.idea
.vscode
website
images
assets
example
examples
coverage
.nyc_output
.circleci
.github
.markdown
.md
.mkd
.ts
.jst
.coffee
.tgz
.swp
*.map
*.mts
*.ts
"


if [ ! "$NODE_ENV" = "production" ]; then
	echo "$TARGET_DIR size before: $(du -sh $TARGET_DIR | awk '{print $1}')"
fi

find_cmd="find $TARGET_DIR \("
first_pattern=true
printf '%s\n' "$PATTERNS" | (
	while IFS= read -r line; do
		line=$(echo "$line" | xargs)

		# skip empty lines
		if [ -z "$line" ]; then
			continue
		fi

		# add -o if not the first pattern
		if [ "$first_pattern" = false ]; then
			find_cmd="$find_cmd -o"
		else
			first_pattern=false
		fi

		find_cmd="$find_cmd -iname '$line'"
	done

	eval "$find_cmd \) -exec rm -rf {} +"
)

if [ ! "$NODE_ENV" = "production" ]; then
	echo "$TARGET_DIR size after:  $(du -sh $TARGET_DIR | awk '{print $1}')"
fi