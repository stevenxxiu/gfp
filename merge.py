
'''
merges the abp matcher module and google search filter plus
'''

import base64
import json
import os
import re
from PyQt4 import QtGui

prefPath='./prefGui/'

class JS:
	def str2descriptor(s):
		return '\n\n/**\n'+s+'\n*/\n'

	def updateUserscriptsMetadata(contents):
		'''
		updates userscripts metadata
		'''
		startToken='// ==UserScript=='
		endToken='// ==/UserScript=='
		newline='\n'
		start=contents.index(startToken)+len(startToken)+len(newline)
		end=contents.index(endToken)-len(newline)
		metadata=contents[start:end].split(newline)
		#add licenses
		licenses=open('licenses.txt','r').read().split(newline)
		for license in licenses:
			license=license.lstrip().rstrip()
			if license=='':
				continue
			license='// @license			'+license
			metadata.append(license)
		return startToken+newline+newline.join(metadata)+newline+endToken+contents[end+len(endToken):]
	
	def mergeJS():
		base=JS.updateUserscriptsMetadata(open('base.js','r').read())
		contents=[
			base,
			#
			JS.str2descriptor('adblock plus matching classes'),
			open('../matchFilter(abp)/FilterClasses.js','r').read(),
			open('../matchFilter(abp)/Matcher.js','r').read(),
			#
			JS.str2descriptor('google search filter plus'),
			open('gfpFilter.js','r').read(),
			open('gfpMatcher.js','r').read(),
			open('gui.js','r').read(),
			open('ext.js','r').read(),
			open('init.js','r').read(),
			#
			JS.str2descriptor('editable grid'),
			open(prefPath+'editableGrid/src/editablegrid.js','r').read(),
			open(prefPath+'editableGrid/src/editablegrid_charts.js','r').read(),
			open(prefPath+'editableGrid/src/editablegrid_editors.js','r').read(),
			open(prefPath+'editableGrid/src/editablegrid_renderers.js','r').read(),
			open(prefPath+'editableGrid/src/editablegrid_utils.js','r').read(),
			open(prefPath+'editableGrid/src/editablegrid_validators.js','r').read(),
			#
			JS.str2descriptor('pref'),
			open(prefPath+'prefGui.js','r').read(),
			#
			open('initAfter.js','r').read(),
		]
		jsContent=''.join(contents)
		
		#gm compatability fixes
		jsContent=jsContent.replace('this.get_html_translation_table','get_html_translation_table')
		
		return jsContent

class HtmlTmp:
	'''
	temp vars for html
	'''
	pass

class Html:
	def __init__(self,htmlContent,jsContent):
		self.htmlContent=htmlContent
		self.jsContent=jsContent
	
	def mergeStyles(self):
		def mergeStyleSub(n):
			contents=open(prefPath+n.group(1),'r').read()
			return '<style>'+contents+'</style>'
		
		self.htmlContent=re.sub(r'<link rel="stylesheet" href="(.+?)".+?>',mergeStyleSub,self.htmlContent)
	
	def mergeScripts(self):
		self.htmlContent=re.sub(r'<script .+?</script>','',self.htmlContent)
	
	def mergeImages(self):
		fileNames=[
			'bullet_arrow_down.png',
			'bullet_arrow_up.png',
			'caption.gif',
			'delete.png',
			'edit_add.png',
			'export.png',
			'import.png',
			'slow.png',
		]
		
		imageStyles=[]
		classNames=[]
		b64srcs=[]
		
		for i,fileName in enumerate(fileNames):
			className='gfpImage_'+str(i)
			classNames.append(className)
			currImg=QtGui.QImage()
			imgData=open(prefPath+fileName,'rb').read()
			b64src='data:image/'+fileName.split('.')[-1]+';base64,'+base64.b64encode(imgData).decode()
			b64srcs.append(b64src)
			currImg.loadFromData(imgData)
			imageStyles.append('.'+className+'{width:'+str(currImg.width())+'px;height:'+str(currImg.height())+
				'px;background-image:url('+b64src+');background-size:100%;}')
		
		def str2attr(s):
			'''
			converts html attributes of s into a dict
			'''
			ret={}
			for n in re.finditer(r'(\w+)=([\'"])(.+?)\2',s):
				ret[n.group(1)]=n.group(3)
			return ret
		
		def attr2str(attr):
			'''
			converts attr dict to html string
			'''
			return ' '.join(key+'="'+val.replace('"','\\"')+'"' for key,val in attr.items())
		
		def imgSrc2class(attr):
			s=attr.pop('src')
			if not s in fileNames:
				raise Exception('unkown image file: '+repr(s))
			return classNames[fileNames.index(s)]
		
		def src2classReplImg(matchObj):
			attr_img=str2attr(matchObj.group(1))
			imgClass=imgSrc2class(attr_img)
			try:
				imgClasses=attr_img['class'].split(' ')
			except KeyError:
				imgClasses=[]
			imgClasses.append(imgClass)
			attr_img['class']=' '.join(imgClasses)
			return '<div '+attr2str(attr_img)+'/>'
		
		def src2classReplA(matchObj):
			attr_a=str2attr(matchObj.group(1))
			attr_img=str2attr(matchObj.group(2))
			#merge classes
			imgClass=imgSrc2class(attr_img)
			try:
				imgClasses=attr_img.pop('class').split(' ')
			except KeyError:
				imgClasses=[]
			try:
				aClasses=attr_a['class'].split(' ')
			except KeyError:
				aClasses=[]
			aClasses.extend(imgClasses)
			aClasses.append(imgClass)
			attr_a['class']=' '.join(aClasses)
			#merge styles
			try:
				imgStyles=attr_img.pop('style').split(';')
			except KeyError:
				imgStyles=[]
			try:
				aStyles=attr_img['style'].split(';')
			except KeyError:
				aStyles=[]
			aStyles.extend(imgStyles)
			aStyles.append('display:inline-block')
			attr_a['style']=';'.join(aStyles)
			#merge other attributes
			if set(attr_a.keys()).intersection(attr_img.keys()):
				raise Exception('attribute overlap between a and img, cannot merge')
			attr_a.update(attr_img)
			return '<a '+attr2str(attr_a)+'></a>'
		
		#replace a img to background-image
		self.htmlContent=re.sub(r'<a ([^<>]+)?><img ([^<>]+?)/></a>',src2classReplA,self.htmlContent)
		self.jsContent=re.sub(r'<a ([^<>]+?)><img ([^<>]+?)/></a>',src2classReplA,self.jsContent)
		#replace references to image to styles if possible, or else to raw data
		self.htmlContent=re.sub(r'<img (.+?)/>',src2classReplImg,self.htmlContent)
		self.jsContent=re.sub(r'<img (.+?)/>',src2classReplImg,self.jsContent)
		
		for fileName,b64src in zip(fileNames,b64srcs):
			self.htmlContent=re.sub(r'([\'"])'+fileName+'\\1','\''+b64src+'\'',self.htmlContent)
			self.jsContent=re.sub(r'([\'"])'+fileName+'\\1','\''+b64src+'\'',self.jsContent)
		
		#add image styles node
		self.htmlContent='<style>'+'\n'.join(imageStyles)+'</style>'+self.htmlContent
	
	def genLoadHTML(self):
		'''
		generates pref.loadHTML()
		'''
		#encode contents
		htmlContent=json.dumps(self.htmlContent)
		return 'pref.loadHTML=function(){let node=document.createElement("div");node.innerHTML='+htmlContent+';document.body.appendChild(node);};'
	
	def getFinalJs(self):
		#get everything between body tags
		self.htmlContent=re.search(r'<body>(.+)</body>',self.htmlContent,re.DOTALL).group(1)
		self.mergeStyles()
		self.mergeScripts()
		self.mergeImages()
		return self.jsContent+'\n'+self.genLoadHTML()


def merge():
	jsContent=JS.mergeJS()
	currHTML=Html(open(prefPath+'prefGui.html','r').read(),jsContent)
	contents=currHTML.getFinalJs()
	gmPath='C:/Users/Steven/AppData/Roaming/Mozilla/Firefox/Profiles/xd56ivw8.default/gm_scripts/google_search_filter_plu/google_search_filter_plu.user.js'
	if not os.access(gmPath,os.F_OK):
		raise Exception('cannot find greasemonkey script path')
	open(gmPath,'w').write(contents)


def main():
	merge()
	#try:
	#	merge()
	#except Exception as e:
	#	print(str(e))

if __name__=='__main__':
	main()
