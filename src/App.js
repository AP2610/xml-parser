import "./App.css";
import React, { useState, useEffect } from "react";

function App() {
	const [pageID, setPageID] = useState("");
	const [xmlFile, setXmlFile] = useState("");
	const [xmlNode, setXmlNode] = useState("");
	const [xmlDomOutput, setXmlDomOutput] = useState("");
	const [stringOutput, setStringOutput] = useState("");
	const [showPdSearch, setShowPdSearch] = useState(false);
	const [showCaSearch, setShowCaSearch] = useState(false);
	const [showHomeScreen, setShowHomeScreen] = useState(true);
	const title = showPdSearch ? ' - Search for a Page Designer page' : showCaSearch ? ' - Search for a Folder' : '';

	function handleShowPDSearch() {
		setShowPdSearch(true);
		setShowCaSearch(false);
		setShowHomeScreen(false);
	}

	function handleShowCASearch() {
		setShowCaSearch(true);
		setShowPdSearch(false);
		setShowHomeScreen(false);
	}

	function handleShowHomeScreen() {
		setShowHomeScreen(true);
		setShowCaSearch(false);
		setShowPdSearch(false);
	}

	// console.log('file: ', xmlFile);
	console.log("pageID: ", pageID);
	// console.log('xmlNode: ', xmlNode);
	useEffect(() => {
		const parsedXml = new DOMParser().parseFromString(xmlFile, "text/xml");
		setXmlNode(parsedXml);
	}, [xmlFile]);

	function handleFileUpload(event) {
		console.log(event.target.files[0]);
		const [file] = event.target.files;
		const reader = new FileReader();

		reader.readAsText(file);
		reader.onloadend = function () {
			setXmlFile(reader.result);
		};
	}

	function handleFileDownload(fileContents) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(fileContents));
		element.setAttribute('download', `${pageID}.xml`);
	
		element.style.display = 'none';
		document.body.appendChild(element);
	
		element.click();
	
		document.body.removeChild(element);
	}

	function handleFindContentBtnClick() {
		if (!pageID || !xmlNode) return;

		const queriedPageElement = xmlNode.querySelector(`[content-id="${pageID}"]`);
		const pageContentLinkElement =queriedPageElement.querySelector("content-links");

		// All content-link elements on the PAGE level
		const allPageContentLinkElements = [...pageContentLinkElement.querySelectorAll("content-link")];

		// Content elments referenced from the content link elements of the PAGE - Most likely layouts
		const linkedContentElementsFirstLevel = allPageContentLinkElements.map((contentLink) => {
			// Grab the content ID of the content linked to the page
			const contentID = contentLink.getAttribute("content-id");

			// Query the XML node for the linked content
			return xmlNode.querySelector(
				`content[content-id="${contentID}"]`
			);
		});

		const linkedContentElementsSecondLevel = linkedContentElementsFirstLevel.map((linkedContent) => {
			const contentLinkElement = linkedContent.querySelector("content-links");
			if (!contentLinkElement) return linkedContent;

			const allContentLinkElements = [...contentLinkElement.querySelectorAll("content-link")];
			const allLinkedContentElements = allContentLinkElements.map((contentLink) => {
				// Grab the content ID of the content linked to the page
				const contentID = contentLink.getAttribute("content-id");

				// Query the XML node for the linked content
				return xmlNode.querySelector(`content[content-id="${contentID}"]`);
			});

			return allLinkedContentElements;
		})
		.flat();

		const layoutsAndComponents = [queriedPageElement, ...linkedContentElementsFirstLevel, ...linkedContentElementsSecondLevel];
		const xmlDomRepresentation = xmlNode.cloneNode(true);

		xmlDomRepresentation.documentElement.innerHTML = "";
		layoutsAndComponents.forEach((item) => xmlDomRepresentation.documentElement.appendChild(item));

		const serializer = new XMLSerializer();
		let xmlAsString = serializer.serializeToString(xmlDomRepresentation)
		xmlAsString = `<?xml version="1.0" encoding="UTF-8"?>
		${xmlAsString}`
		console.log('xmlAsString: ', xmlAsString);
		setStringOutput(xmlAsString);
		setXmlDomOutput(xmlDomRepresentation.document.body);

		console.log("xmlDomRepresentation: ", xmlDomRepresentation);
		console.log("xmlNode: ", xmlNode);
	}

	return (
		<div className={`App container ${showHomeScreen ? 'start-screen' : ''}`}>
			<div className="row">
				<h1 className="col-12 my-5">XML Parser {title}</h1>
			</div>

			<div className="row mb-5">
				{
					// Show these buttons only when one of these is not true
					!(showPdSearch || showCaSearch) &&
					<>
						<div className="col-6">
							<button className="btn btn-primary w-100" onClick={() => handleShowPDSearch()}>Find Page Designer Page</button>
						</div>

						<div className="col-6">
							<button className="btn btn-secondary w-100" onClick={() => handleShowCASearch()}>Find Content Assets by Folder</button>
						</div>
					</>
				}


				{
					// Show home screen button only when one of these is true
					(showPdSearch || showCaSearch) &&
					<>
						<div className="col-6">
							<button className="btn btn-primary w-100" onClick={() => handleShowHomeScreen()}>Home Screen</button>
						</div>
					</>
				}


			</div>

			{
				!showHomeScreen &&
				<>
					{
						showPdSearch &&
						<>
							<div className="row form-group">
								<div className="col-3 mb-4 pe-0">
									<input className="form-control h-100 choose-file" onChange={handleFileUpload} type="file" accept="text/xml" />
								</div>

								<div className="col-6 mb-4 px-0">
									<input
										className="form-control asset-id"
										onChange={(event) => setPageID(event.target.value)}
										placeholder="Page ID"
										value={pageID}
									/>
								</div>

								<div className="col-3 ps-0">
									<button
										className="btn btn-primary form-control find-asset-button"
										type="button"
										onClick={handleFindContentBtnClick}
										disabled={pageID.length === 0 || xmlFile.length === 0}
									>
										Find Page and related content
									</button>
								</div>
							</div>


							<div className="row form-group mb-4">
								<div className="col-9 pe-0">
									<textarea className="form-control xml-textarea" placeholder="Manipulated XML" value={stringOutput} />
								</div>

								<div className="col-3 form-group justify-content-around ps-0">
									<div className="col-12">
										<button 
											className="btn btn-primary w-100 download-button" 
											onClick={() => {handleFileDownload(stringOutput)}} 
											disabled={stringOutput.length === 0}
										>
											Download manipulated XML
										</button>
									</div>

									<div className="col-12">
										<button className="btn btn-secondary w-100 search-again-button" onClick={() => window.location.reload()}>
											Search again
										</button>
									</div>
								</div>
							</div>
						</>
					}

					{
						showCaSearch &&
						<>
							<div className="row form-group">
								<div className="col-3 mb-4 pe-0">
									<input className="form-control h-100 choose-file" onChange={handleFileUpload} type="file" accept="text/xml" />
								</div>

								<div className="col-6 mb-4 px-0">
									<input
										className="form-control asset-id"
										onChange={(event) => setPageID(event.target.value)}
										placeholder="Folder ID"
										value={pageID}
									/>
								</div>

								<div className="col-3 ps-0">
									<button
										className="btn btn-primary form-control find-asset-button"
										type="button"
										onClick={handleFindContentBtnClick}
										disabled={pageID.length === 0 || xmlFile.length === 0}
									>
										Find folder and related assets
									</button>
								</div>
							</div>


							<div className="row form-group mb-4">
								<div className="col-9 pe-0">
									<textarea className="form-control xml-textarea" placeholder="Manipulated XML" value={stringOutput} />
								</div>

								<div className="col-3 form-group justify-content-around ps-0">
									<div className="col-12">
										<button 
											className="btn btn-primary w-100 download-button" 
											onClick={() => {handleFileDownload(stringOutput)}} 
											disabled={stringOutput.length === 0}
										>
											Download manipulated XML
										</button>
									</div>

									<div className="col-12">
										<button className="btn btn-secondary w-100 search-again-button" onClick={() => window.location.reload()}>
											Search again
										</button>
									</div>
								</div>
							</div>
						</>
					}			
				</>
			}

		</div>
	);
}

export default App;
