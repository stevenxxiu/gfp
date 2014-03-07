
'''
merges the abp matcher module and google search filter plus
'''

import sys
sys.path.append('D:/desktop/web/greasemonkey')
import os
import gmmerge

prefPath='./prefGui/'

def mergeImages():
	imgMerger=gmmerge.img.ImgMerger(classPrefix='gfpImage_',basePath=prefPath)
	imgMerger.addPaths([
		'bullet_arrow_down.png',
		'bullet_arrow_up.png',
		'caption.gif',
		'delete.png',
		'edit_add.png',
		'export.png',
		'import.png',
		'slow.png',
	])
	return imgMerger

def mergeHTML(sr):
	imgMerger=mergeImages()
	htmlMerger=gmmerge.html.HtmlMerger(imgMerger)
	htmlMerger.addPath(os.path.join(prefPath,'prefGui.html'))
	#write img data to css & js
	imgMerger.toJS(sr)
	#write loadHTML function
	sr.write('pref.loadHTML=function(){let node=document.createElement("div");')
	htmlMerger.toJSVar('node.innerHTML',sr)
	sr.write('document.body.appendChild(node);};')
	return htmlMerger

def mergeJS(sr):
	jsMerger=gmmerge.js.JSMerger(sr)
	basePath='base.js'

	#add licenses
	with open(basePath,'r') as baseSr:
		metadata=gmmerge.metadata.decode(baseSr)
		metadata.addLicenses(open('licenses.txt','r').read().split('\n'))
		gmmerge.metadata.encode(metadata,sr)
		jsMerger.addSr(baseSr,basePath)

	jsMerger.writeComment('helper')
	jsMerger.addPaths(['utils.js','logger.js'])

	jsMerger.writeComment('adblock plus matching classes')
	jsMerger.addPaths([
		'./matchFilter(abp)/FilterClasses.js',
		'./matchFilter(abp)/Matcher.js',
		])

	jsMerger.writeComment('google search filter plus')
	jsMerger.addPaths([
		'gfpFilter.js',
		'gfpMatcher.js',
		'gui.js',
		'ext.js',
		'init.js',
		])

	jsMerger.writeComment('editable grid')
	jsMerger.addPath(os.path.join(prefPath,'editableGrid/src'))

	jsMerger.writeComment('pref')
	jsMerger.addPath(os.path.join(prefPath,'prefGui.js'))

	jsMerger.addPath('initAfter.js')


def merge():
	testPath='C:/Users/Steven/Desktop/tmpDownloads/test'
	sr=open(os.path.join(testPath,'merged.js'),'w')
	mergeJS(sr)
	mergeHTML(sr)
	sr.close()

	#gmPath='C:/Users/Steven/AppData/Roaming/Mozilla/Firefox/Profiles/xd56ivw8.default/scriptish_scripts/google_search_filter_plu/google_search_filter_plu.user.js'
	#if not os.access(gmPath,os.F_OK):
	#	raise Exception('cannot find greasemonkey script path')
	#open(gmPath,'w').write(contents)

def main():
	merge()

if __name__=='__main__':
	main()
